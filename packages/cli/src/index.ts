#!/usr/bin/env node
import AWS from 'aws-sdk';
import { EnvironmentServiceAppSyncClient } from '@daysmart/frankenstack-appsync-client'
const ssmConfig = require('./utils/ssmConfig');
const uuid = require('uuid');
const parseYaml = require('./utils/parseYaml');
const flatten = require('flat');
const archiver = require('archiver');
const stream = require('stream');
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { resolveComponents, resolveInputVariables } from './utils/variables';


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
    public client: any;
    public params: any;

    constructor(command: any, file: string, config?: any) {
        this.file = file;
        this.command = command;
        this.config = config;
        this.deploymentGuid = uuid.v4();
        this.params = {};
        if(config.params) {
            try {
                this.params = JSON.parse(config.params);
            } catch(err) {
                throw `Failed to parse parameters ${config.params}. Please format your parameters as valid JSON`
            }
        }
    }

    async run() {
        const creds = await defaultProvider({profile: this.config.profile})();
        AWS.config.credentials = creds;
        const awsconfig = await ssmConfig(creds, this.config.stageOveride);
        const client = new EnvironmentServiceAppSyncClient(
            awsconfig,
            creds //await (new CredentialProviderChain()).resolvePromise()
        )
        if(this.command === 'deploy') {
            await this.deploy(this.config._[3], creds, awsconfig, client);
        } else if (this.command === 'rollback') { 
            await this.rollback(this.config._[3], this.config._[4], client);
        } else if(this.command === 'iam') {
            await this.putIAM(this.config._[3], client);
        } else if(this.command === 'remove'){
            await this.remove(this.config._[3], this.config._[4], client);  
        } else if(this.command === 'component') {
            if(this.config._[3] === 'describe') {
                await this.describeComponent(this.config._[4], this.config._[5], client);
            } else {
                console.error(`The command component ${this.config._[3]} is not implemented`)
            }
        } else {
            console.error(`The command ${this.command} is not implemented`);
        }
    }

    async deploy(file: string, creds: any, awsconfig: any, client: EnvironmentServiceAppSyncClient) {
        const template: Template = this.parseComponentTemplate(file);
        console.log('Created deployment', this.deploymentGuid);
        console.log("Packaging project...")

        const output = new stream.PassThrough();
        const archive = archiver('zip');
        
        output.on('error', function(err: any) {
            console.error(err);
            throw err;
        });

        output.on('end', function() {
            console.log('Package prepared. Uploading to S3...');
        });
        
        archive.on('error', function(err: any) {
            console.error(err);
            throw err;
        });
        
        archive.pipe(output);
        archive.glob('**', {ignore: 'node_modules/**', dot: true});
        archive.finalize();

        const upload = new Upload({
            client: new S3Client({
                region: awsconfig.aws_user_files_s3_bucket_region || 'us-east-1',
                credentials: creds
            }),
            params: {
                Bucket: awsconfig.aws_user_files_s3_bucket,
                Key: this.deploymentGuid + `.zip`,
                Body: output,
                ContentType: 'application/zip'
            }
        });
        await upload.done();
        console.log("Packaging complete!");

        await this.deployTemplate(client, template);
    }

    async rollback(environment: string, componentName: string, client: EnvironmentServiceAppSyncClient) {
        const rollbackComponentResp = await client.getComponentRollback(environment, componentName);


        if(rollbackComponentResp.data) {
            const componentDeployment = rollbackComponentResp.data.getComponentRollbackState;

            const deploymentRequest = await client.getDeploymentRequest(componentDeployment.deploymentGuid);

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
                    inputs: (deploymentRequest.data && deploymentRequest.data.getDeploymentRequest.components[0].inputs) ? deploymentRequest.data.getDeploymentRequest.components[0].inputs.map((input: any) => {
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

    async remove(environment: string, componenentName: string, client: EnvironmentServiceAppSyncClient) {
        console.log(`Removing component ${environment}:${componenentName}`);
        await client.removeComponent({
            deploymentGuid: this.deploymentGuid,
            env: environment,
            componentName: componenentName
        })
        this.subscribeToDeploymentUpdates(client);
    }

    async describeComponent(environment: string, componentName: string, client: EnvironmentServiceAppSyncClient) {
        console.log(`Looking up component ${environment} ${componentName}`);
        try {
            const resp = await client.describeComponent(environment, componentName);
            if(resp.data && resp.data.describeComponent) {
                const component = resp.data.describeComponent;
                console.log(`${component.env} ${component.name}
Created: ${new Date(component.create).toUTCString()}
Last Deployment (${component.deploymentGuid}): ${component.status} at ${new Date(component.update).toUTCString()}
Inputs:
${component.inputs ? component.inputs.map((input: any) => `${input.name}: ${input.value}`).join('\n') : 'none'}
Outputs:
${component.outputs ? component.outputs.map((output: any) => `${output.name}: ${output.value}`).join('\n') : 'none'}
            `)
            } else {
                console.error(`Could not find component!`)
            }
        } catch(err) {
            console.error(`Could not find component!`)
        }
    }

    async deployTemplate(client: EnvironmentServiceAppSyncClient, template: Template) {
        await client.sendDeploymentForm(this.deploymentGuid, template);
        this.subscribeToDeploymentUpdates(client);
    }

    subscribeToDeploymentUpdates(client: EnvironmentServiceAppSyncClient){
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

    async putIAM(file: string, client: EnvironmentServiceAppSyncClient) {
        var template = parseYaml(file);

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
        template.env = resolveInputVariables(template.env, template, this.params);
        template = resolveComponents(template, this.params);
        if(template.templates) {
            template.templates.forEach((child: any) => {
                if(!child.path) {
                    throw "Could not resolve child template without path";
                }
                const childTemplatePath = resolveInputVariables(child.path, template, this.params);
                var childTemplate = parseYaml(childTemplatePath);
                childTemplate.env = resolveInputVariables(childTemplate.env, childTemplate, {...this.params, ...child.params});
                if(childTemplate.env !== template.env) {
                    throw "Child templates must have the same environment as the parent template"
                }
                childTemplate = resolveComponents(childTemplate, {...this.params, ...child.params});
                template.components = template.components.concat(childTemplate.components);
            });
            delete template.templates;
        }
        return template;
    }
}
