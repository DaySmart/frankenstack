
import { Component } from "../../generated/Entities/Component";
import { Deployment } from "../../generated/Entities/Deployment";
import { ComponentDeployment } from '../../generated/Entities/ComponentDeployment';
import { Observation2 } from "o18k-ts-aws";

const LOOKUP_PATTERN = new RegExp(/\$\{(.*?)\}/);

export function getProviderAccountComponentLookups(observation: Observation2<Deployment.EntityObservation>): Array<string> {
    let componentNames: Array<string> = [];
    for(var component of observation.data.Components) {
        if(component.Provider && component.Provider.Config) {
            const account = component.Provider.Config.find(config => config.Key === 'account');
            if(account) {
                let match = account.Value.match(LOOKUP_PATTERN);
                if(match) {
                    if(!componentNames.includes(match[1])) {
                        componentNames.push(match[1]);
                    }
                }
            }
        }
    }
    return componentNames;
}

export function lookupProviderAccountFromAccountComponents(accountLookup: string, dependentAccountComponentObservations: Array<Component.EntityObservation>): ComponentDeployment.Account | undefined {
    let match = accountLookup.match(LOOKUP_PATTERN);
    if(match) {
        let lookupNameSplit = match[1].split(":");
        let lookupEnvironment = lookupNameSplit[0];
        let lookupComponentName = lookupNameSplit[1];

        let accountComponent = dependentAccountComponentObservations.find(component => {
            return lookupEnvironment === component.data.Env && lookupComponentName === component.data.Name
        });

        if(accountComponent) {
            let accountId = accountComponent.data.Outputs?.find(output => output.Key === 'accountId');
            if(!accountId) {
                throw `Account ${lookupEnvironment}:${lookupComponentName} is missing accountId`;
            }

            let credentails = accountComponent.data.Outputs?.find(output => output.Key === 'credentials');
            if(!credentails) {
                throw `Account ${lookupEnvironment}:${lookupComponentName} is missing credentials`
            }

            return {
                accountId: accountId?.Value  || "",
                credentials: credentails?.Value || ""
            }
        }

        throw `Failed to find account named ${lookupEnvironment}:${lookupComponentName}`;
    }
    return undefined;
}