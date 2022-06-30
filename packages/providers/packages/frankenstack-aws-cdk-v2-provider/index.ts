import { BaseProvider } from 'frankenstack-base-provider';
import { Construct } from 'constructs';
import { Stack, App } from 'aws-cdk-lib';
import { Configuration } from 'aws-cdk/lib/settings';
import { SdkProvider } from 'aws-cdk/lib/api/aws-auth';
import { CloudExecutable } from 'aws-cdk/lib/api/cxapp/cloud-executable';
import { Credentials, CredentialProviderChain, SSM } from 'aws-sdk';
import * as cxapi from '@aws-cdk/cx-api';
import { CloudFormationDeployments } from 'aws-cdk/lib/api/cloudformation-deployments';
import { DeployStackResult } from 'aws-cdk/lib/api/deploy-stack';
import fs = require('fs');


export default class AWSCDKv2Provider extends BaseProvider {
    private awsAccount: any;
    private region: string = 'us-east-1';

    async deploy() {
        const providerConfig = (this.config.componentProvider.config) ? this.config.componentProvider.config.reduce((obj: any, item: any) => {
            return {
                ...obj,
                [item.key]: item.value
            }
        }, {}) : undefined
        this.awsAccount = this.config.componentProvider.account;
        this.region = providerConfig.region;
        console.log('awsAccount', this.awsAccount);
        let construct: any;
        const { createRequireFromPath } = require('module');

        if(providerConfig.constructPath) {
            construct = await import(process.cwd() + '/' + providerConfig.constructPath);
        } else if(providerConfig.constructPackage) {
            const requireUtil = createRequireFromPath(process.cwd() + '/node_modules')
            construct = requireUtil(providerConfig.constructPackage);
        } else {
            throw "Need to define constructPath or constructPackage!";
        }

        const constructName = providerConfig.constructName ? providerConfig.constructName : Object.keys(construct)[0];
        const componentName = this.config.componentName;
        const env = this.config.environment;
        const componentProps = this.config.inputs.reduce((obj: any, item: any) => {
            return {
                ...obj,
                [item.key]: item.value
            }
        }, {});

        class CdkStack extends Stack {
            constructor(scope: Construct, id: string, props: any) {
                super(scope, id, props);

                new construct[constructName](this, constructName, componentProps);
            }
        }

        if(!fs.existsSync('cdk.context.json')) {
            fs.writeFileSync('cdk.context.json', JSON.stringify({}));
        }

        const configuration = new Configuration();
        await configuration.load();

        function refreshApp(account: string, region: string): App {
            console.log('refresh app');
            const app = new App({context: { 
                ...configuration.context.all,
            
            },
            outdir: 'cdk.frankenstack.out',
            analyticsReporting: false
            });
            console.log('refresh app', app);
            const s = new CdkStack(app, `${env}-${componentName}`, {
                env: {
                    account: account,
                    region: region
                }
            });
            console.log('refresh stack node meta', s.node.metadata.length);
            app.synth({force: true});
            console.log('refresh app synth', app);
            return app;
        }

        let accountId: string;
        let awsCredentials;
        if(this.awsAccount) {
            accountId = this.awsAccount.accountId;
            awsCredentials = this.awsAccount.credentials;
        } else {
            accountId = providerConfig.account;
        }
        console.log('accountId', accountId);
        console.log('credentials', awsCredentials);

        let app = refreshApp(accountId, providerConfig.region);
        const sdkProvider = await this.getSdkProvider(awsCredentials);
        console.log('sdkProvider', sdkProvider);

        const cloudExecutable = new CloudExecutable({
            configuration,
            sdkProvider,
            synthesizer: async (aws: SdkProvider, config: Configuration): Promise<cxapi.CloudAssembly> => {
                await config.load();
                app = refreshApp(accountId, this.region);
                let stackAssembly = app.synth({force: true});
                return new cxapi.CloudAssembly(stackAssembly.directory);
            }
        });

        const assembly = await cloudExecutable.synthesize();

        const cloudformation = new CloudFormationDeployments({sdkProvider: sdkProvider});

        const stack = assembly.assembly.stacks[0];
        
        let result: DeployStackResult | undefined;
        try {
             result = await cloudformation.deployStack({
                stack,
                deployName: stack.stackName,
                force: true
            });
        } catch(err) {
            this.result = false;
            this.outputs = [];
        }

        if(result) {
            console.log(`Successfully deployed ${result.stackArn}!`);
            this.result = true;
            this.outputs = result.outputs ? Object.entries(result.outputs)?.map(output => {return {Key: output[0], Value: output[1]}}) : []
        }
    }

    async getSdkProvider(paramaterName?: string): Promise<SdkProvider> {
        console.log('getSdkProvider parameterName', paramaterName);
        if(paramaterName) {
            const ssm = new SSM();
            const param = await ssm.getParameter({
                Name: paramaterName.replace('ssm:', ''),
                WithDecryption: true
            }).promise();

            if(param.Parameter && param.Parameter.Value) {
                console.log('getSdkProvider paramValue', param.Parameter.Value);
                const credentials = JSON.parse(param.Parameter.Value);
                const credentialProviders = [
                    () => { 
                        return new Credentials({
                            accessKeyId: credentials.AWS_ACCESS_KEY_ID,
                            secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY
                        })
                    }
                ]
    
                const chain = new CredentialProviderChain(credentialProviders)

                return new SdkProvider(chain, this.region, {})
            } 
        }
        return SdkProvider.withAwsCliCompatibleDefaults({});
    }
}