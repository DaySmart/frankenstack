#!/usr/bin/env node
import AWS from 'aws-sdk';
const fs = require('fs');
import { EnvironmentServiceAppSyncClient } from '@daysmart/frankenstack-appsync-client'
const ssmConfig = require('./utils/ssmConfig');
const uuid = require('uuid');
const path = require('path');
const parseYaml = require('./utils/parseYaml');
const s3 = require('s3-node-client');
const pEvent = require('p-event');
const { zip } = require('zip-a-folder');
const flatten = require('flat');
import { defaultProvider } from '@aws-sdk/credential-provider-node';


interface CustomNodeJsGlobal extends NodeJS.Global {
    WebSocket: any;
}
declare const global: CustomNodeJsGlobal;

global.WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');

process.on('uncaughtException', err => { })

interface Template {
    env: string;
    components: Array<Component>
}

interface Component {
    name: string;
    provider: Provider;
    inputs?: Array<{key: string, value: string}>;
    outputs?: Array<{key: string, value: string}>;
}

interface Provider {
    name: string;
    config?: Array<{key: string, value: string}>;
}

export default class Deployer {
    public file: any;
    public command: any;
    public deploymentGuid: any;
    public config: any;

    constructor(command: any, file: string, config?: any) {
        this.file = file;
        this.command = command;
        this.config = config;
        this.deploymentGuid = uuid.v4();
    }

    async run() {
        if(this.command === 'deploy') {
            await this.deploy(this.config._[3]);
        } else if (this.command === 'rollback') { 
            await this.rollback(this.config._[3], this.config._[4]);
        } else if(this.command === 'destroy') {
            await this.destroy();
        } else if(this.command === 'iam') {
            await this.putIAM(this.config._[3]);
        } else {
            console.error(`The command ${this.command} is not implemented`);
        }
    }

    async deploy(file: string) {
        const template: Template = this.parseComponentTemplate(file);
        console.log('template', JSON.stringify(template, null, 2));
        console.log('Created deployment', this.deploymentGuid);
        const repoName = process.cwd();
        const creds = await defaultProvider({})();
        AWS.config.credentials = creds;
        const awsconfig = await ssmConfig(creds, this.config.stageOveride);
        console.log("Zipping package...")
        if(fs.existsSync('.deployer')) {
            fs.rmdirSync('.deployer', {recursive: true});
            
        }
        fs.mkdirSync('.deployer');

        await zip(repoName, `.deployer/${this.deploymentGuid}.zip`);
        console.log("Package zipped!");

        const awsS3Client = new AWS.S3({region: 'us-east-1', credentials: creds});
        const s3Client = s3.createClient({s3Client: awsS3Client});
        const params = {
            s3Params: {
                Bucket: awsconfig.aws_user_files_s3_bucket,
                Key: this.deploymentGuid + `.zip`,
            },
            localFile: repoName + `/.deployer/${this.deploymentGuid}.zip`,
        };

        console.log("Uploading package to S3...");
        const uploader = s3Client.uploadFile(params);
        await pEvent(uploader, 'end');
        console.log('Package upload complete!');
        
        const client = new EnvironmentServiceAppSyncClient(
            awsconfig,
            creds //await (new CredentialProviderChain()).resolvePromise()
        )

        await this.deployTemplate(client, template);
    }

    async rollback(environment: string, componentName: string) {
        const creds = await defaultProvider({})();
        const awsconfig = await ssmConfig(creds, this.config.stageOveride);

        const client = new EnvironmentServiceAppSyncClient(
            awsconfig,
            creds
        )

        const rollbackComponentResp = await client.getComponentRollback(environment, componentName);

        if(rollbackComponentResp.data) {
            const componentDeployment = rollbackComponentResp.data.getComponentRollbackState;

            let artifactOverideGuid = componentDeployment.deploymentGuid;
            const artifactOverideGuidItems = componentDeployment.provider.config.filter((item: any) => item.name === 'artifactOverideGuid');
            if(artifactOverideGuidItems.length > 0) {
                artifactOverideGuid = artifactOverideGuidItems[0].value;
            }

            let providerConfig = componentDeployment.provider.config.filter((item: any) => item.name !== 'artifactOverideGuid');

            const template: Template = {
                env: componentDeployment.env,
                components: [{
                    name: componentDeployment.name,
                    provider: {
                        name: componentDeployment.provider.name,
                        config: [
                            {name: 'artifactOverideGuid', value: artifactOverideGuid},
                            ...providerConfig.map((configItem: any) => {
                                if(configItem.name !== 'artifactOverideGuid') {
                                    return {
                                        name: configItem.name,
                                        value: configItem.value
                                    }
                                }
                            })
                        ]
                    },
                    inputs: componentDeployment.inputs ? componentDeployment.inputs.map((input: any) => {
                        return {
                            name: input.name,
                            value: input.value
                        }
                    }) : undefined
                }]
            }

            console.log(`Rolling back component ${environment}:${componentName} to deployment ${componentDeployment.deploymentGuid}`);

            await this.deployTemplate(client, template);
        }
    }

    async destroy() {}

    async deployTemplate(client: EnvironmentServiceAppSyncClient, template: Template) {
        await client.sendDeploymentForm(this.deploymentGuid, template);

        const observable = client.subscribeToDeploymentUpdate(this.deploymentGuid);

        const realtimeResults = (data: any) => {
            console.log(data.data.subscribeToDeploymentUpdate.message);
            let updateType = data.data.subscribeToDeploymentUpdate.type
            if(['DONE', 'ERROR'].includes(updateType)) {
                let exitCode = (updateType === 'ERROR') ? 1 : 0
                try {
                    subscription.unsubscribe();
                    process.exit(exitCode);
                } catch(err) {}
                
            }
        }
        
        const subscription = observable.subscribe({
            next: data => {
                realtimeResults(data);
            },
            error: error => {
                console.warn(error);
            }
        });
    }

    async putIAM(file: string) {
        var template = parseYaml(file);
        const creds = await defaultProvider({})();
        const awsconfig = await ssmConfig(creds, this.config.stageOveride);

        const client = new EnvironmentServiceAppSyncClient(
            awsconfig,
            creds
        )

        if(template.policies) {
            for(var policy of template.policies) {

                try {
                    const resp = await client.putPolicy({
                        policyName: policy.name,
                        statements: policy.statements.map(
                            (statement: any) => {
                                return {
                                    effect: statement.effect,
                                    actions: statement.actions,
                                    resources: statement.resources
                                }
                            }
                        )
                    });

                    console.log(`Succesfully updated policy: ${policy.name}`);
                } catch(err) {
                    console.error(`Failed to put policy: ${policy.name}`, err);
                }
            }

            for(var user of template.users) {
                try {
                    const resp = await client.putUser({
                        userId: user.id,
                        email: user.email,
                        policies: user.policies
                    });
    
                    console.log(`Succesfully updated user: ${user.id}`);
                } catch(err) {
                    console.error(`Failed to put user: ${user.id}`, err);
                }
            }
        }

    }

    parseComponentTemplate(file: string) {
        var template = parseYaml(file);
        template.components = template.components.map((component: any) => {
            if(component.provider.config) {
                component.provider.config = Object.entries(component.provider.config).map(([key, value]) => {
                    return {
                        name: key,
                        value: value
                    }
                })
            }
            if(component.inputs) {
                component.inputs = flatten(component.inputs);
                component.inputs = Object.entries(component.inputs).map(([key, value]) => {
                    return {
                        name: key,
                        value: value
                    }
                })
            }
            return component;
        });
        return template;
    }
}
