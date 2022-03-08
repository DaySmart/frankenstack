'use strict';
const fs = require('fs');
const yaml = require('js-yaml');
const AWS = require('aws-sdk');
const frankenstackClient = require('@daysmart/frankenstack-appsync-client');

class ServerlessFrankenstackPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        const delegate = this.serverless.variables.populateService.bind(this.serverless.variables)

        this.serverless.variables.populateService = async (options) => {
            await this.resolveFrankenstackInputs()
      
            return delegate(options)
        }

        this.config = this.serverless.service.custom.frankenstack;
    }

    async resolveFrankenstackInputs() {
        const customProp = this.config.inputsProperty;

        if(this.config.excludeStages && this.config.excludeStages.includes(this.options.stage)) {
            return
        }

        if(process.env.IN_FRANKENSTACK === 'true') {
            this.serverless.service.custom[customProp] = "${file(.deployer/serverless.config.yaml)}"
            return
        }

        const template = this.parseComponentTemplate(this.config.template);
        const componentName = this.config.component;
        const env = template.env;
        const component = template.components.find(component => component.name == componentName);

        const awsconfig = await this.getAppsyncCongig()

        const client = new frankenstackClient.EnvironmentServiceAppSyncClient(
            awsconfig,
            await (new AWS.CredentialProviderChain()).resolvePromise()
        );
        
        const res = await client.getResolvedInputs(env, component);

        const resolvedInputs = res.data.getResolvedInputs;
        const inputs = Object.assign({}, ...resolvedInputs.map(input => ({[input.name]: input.value})));
        this.serverless.service.custom[customProp] = inputs;
    }

    parseComponentTemplate(file) {
        var template = yaml.load(fs.readFileSync(file, 'utf-8'));
        template.components = template.components.map((component) => {
            if(component.provider.config) {
                component.provider.config = Object.entries(component.provider.config).map(([key, value]) => {
                    return {
                        name: key,
                        value: value
                    }
                })
            }
            if(component.inputs) {
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

    async getAppsyncCongig() {
        const ssm = new AWS.SSM({region: 'us-east-1'});
        const param = await ssm.getParameter({
            Name: `prod-frankenstack-amplify-config`,
            WithDecryption: true
        }).promise();
        if(param.Parameter && param.Parameter.Value) {
            return JSON.parse(param.Parameter.Value);
        } else {
            throw `No configuration exists from ${paramStage}`;
        }
    }

    async getFrankenstackClient(awsconfig) {
        const client = new frankenstackClient.EnvironmentServiceAppSyncClient(
            awsconfig,
            await (new AWS.CredentialProviderChain()).resolvePromise()
        );
        return client;
    } 
}

module.exports = ServerlessFrankenstackPlugin;
