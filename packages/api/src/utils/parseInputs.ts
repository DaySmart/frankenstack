import { Component } from "../../generated/Entities/Component";
import { Deployment } from "../../generated/Entities/Deployment";
import { DeploymentRequest } from "../../generated/Entities/DeploymentRequest";
import { IEntityObservation } from "../../generated/Entities/IEntityObservation";
import { ResolvedInputsQuery } from "../../generated/Entities/ResolvedInputsQuery";
import { Observation2 } from "../../generated/Observation2";


const LOOKUP_PATTERN = new RegExp(/\$\{(.*?)\}/);

export function getComponentLookup(observation: Observation2<IEntityObservation>): Array<string> {
    let componentNames: Array<string> = [];
    console.log('getComponentLookup args', observation);
    if(observation.entity === DeploymentRequest.ENTITY_NAME) {
        for(var component of observation.data.Components) {
            if(component.Inputs) {
                for(var input of component.Inputs) {
                    componentNames = matchInput(input, componentNames);
                }
            }
        }
    } else if (observation.entity === ResolvedInputsQuery.ENTITY_NAME) {
        console.log('getComponentLookup is ResolvedInputQuery');
        if(observation.data.Component.Inputs) {
            console.log('getComponentLookup inputs', observation.data.Component.Inputs);
            for(var input of observation.data.Component.Inputs) {
                componentNames = matchInput(input, componentNames);
                console.log('getComponentLookup postMatch', input, componentNames);
            }
        }
    }

    return componentNames;
}

function matchInput(input: {Key: string, Value: string}, componentNames: Array<string>): Array<string> {
    // Can't log this because it could log secrets
    // console.log('matchInput args', input, componentNames);
    let match = input.Value.match(LOOKUP_PATTERN)
    if(match) {
        let lookupParams = match[1].split(':');
        let componentName = `${lookupParams[0]}:${lookupParams[1]}`
        console.log('matchInput componentName', componentName);
        if(!componentNames.includes(componentName)) {
            componentNames.push(componentName);
        }
    }
    console.log('matchOutput return', componentNames);
    return componentNames;
}

export function isComponentInputsResolved(component: Deployment.Component): boolean {
    let inputsResolved = true;
    if(component.Inputs) {
        for(var input of component.Inputs) {
            let match = input.Value.match(LOOKUP_PATTERN);
            if(match) {
                inputsResolved = false;
            }
       }
    }
    return inputsResolved;
}

export function replaceComponentInputLookups(
    observation: Observation2<IEntityObservation>,
    dependentComponents: Observation2<Component.EntityObservation>[]
): Observation2<IEntityObservation> {
    if(observation.entity === Deployment.ENTITY_NAME) {
        let componentsInTemplate = observation.data.Components.map(component => component.Name);
        for(var i = 0; i < observation.data.Components.length; i++) {
            let component = observation.data.Components[i];
            if(['DEPLOY_IN_PROGRESS', 'DEPLOYED', 'DEPLOYMENT_FAILED'].includes(component.Status as string)) {
                continue;
            }
            if(component.Inputs) {
                for(var j = 0; j < component.Inputs.length; j++) {
                    let input = component.Inputs[j];
                    let match = input.Value.match(LOOKUP_PATTERN);
                    if(match) {
                        let inputValueSplit = match[1].split(':');
                        let lookupEnvironment = inputValueSplit[0];
                        let lookupComponentName = inputValueSplit[1];

                        if(
                            observation.data.Env === lookupEnvironment &&
                            componentsInTemplate.includes(lookupComponentName)
                        ) {
                            let inTemplateComponent = observation.data.Components.find(component => component.Name === lookupComponentName);
                            if(inTemplateComponent && inTemplateComponent.Status !== 'DEPLOYED') {
                                continue;
                            }
                        }
                        let variableName = inputValueSplit[2];
                        // @ts-ignore
                        observation.data.Components[i].Inputs[j].Value = lookupComponentOutput(
                            lookupEnvironment,
                            lookupComponentName,
                            variableName,
                            dependentComponents
                        );
                    }
                }
            }
        }
    } else if (observation.entity === ResolvedInputsQuery.ENTITY_NAME) {
        console.log('replaceComponentInputLookups ResolvedInputsQuery', observation.data.Component.Inputs);
        if(observation.data.Component.Inputs) {
            for(var j = 0; j < observation.data.Component.Inputs.length; j++) {
                let input = observation.data.Component.Inputs[j];
                let match = input.Value.match(LOOKUP_PATTERN);
                if(match) {
                    let inputValueSplit = match[1].split(':');

                    let componentEnv = inputValueSplit[0];
                    let componentName = inputValueSplit[1];
                    let variableName = inputValueSplit[2];

                    observation.data.Component.Inputs[j].Value = lookupComponentOutput(
                        componentEnv,
                        componentName,
                        variableName,
                        dependentComponents
                    )
                }
            }
        }
    }
    console.log('replaceComponentInputLookups return', observation);
    return observation;
}

export function resolveReferencesForDeploymentRequestComponent(
    observation: Observation2<DeploymentRequest.EntityObservation>,
    component: DeploymentRequest.Component,
    dependentComponentObservations: Observation2<Component.EntityObservation>[]
): Array<{Key: string, Value: string, FailedLookupStatus?: Deployment.ComponentDeploymentStatus, FailedLookupMessage?: string}> {
    let resolvedInputs = (component.Inputs ? component.Inputs : []) as
        Array<{Key: string, Value: string, FailedLookupStatus?: Deployment.ComponentDeploymentStatus, FailedLookupMessage?: string}>;

    const componentsInTemplate = observation.data.Components.map(component => component.Name);
    if(resolvedInputs) {
        for(var j = 0; j < resolvedInputs.length; j++) {
            let input = resolvedInputs[j];
            let match = input.Value.match(LOOKUP_PATTERN);
            if(match) {
                let inputValueSplit = match[1].split(':');

                let componentEnv = inputValueSplit[0];
                let componentName = inputValueSplit[1];
                let variableName = inputValueSplit[2];

                if(componentEnv === observation.data.Env && componentsInTemplate.includes(componentName)) {
                    resolvedInputs[j].FailedLookupStatus = "WAITING_ON_DEPENDENT_DEPLOYMENT";
                    resolvedInputs[j].FailedLookupMessage = `Dependency found on component in template: ${componentEnv}:${componentName}`
                } else {
                    try {
                        resolvedInputs[j].Value = lookupComponentOutput(
                            componentEnv,
                            componentName,
                            variableName,
                            dependentComponentObservations
                        )
                    } catch(err: any) {
                        resolvedInputs[j].FailedLookupStatus = 'DEPLOYMENT_FAILED';
                        resolvedInputs[j].FailedLookupMessage = err.message;
                    }
                }
            }
        }
    }
    return resolvedInputs;
}

export function resolveReferenceFromComponentObservation(
    observation: Observation2<Component.EntityObservation>,
    component: Deployment.Component,
): Array<{Key: string, Value: string, FailedLookupStatus?: Deployment.ComponentDeploymentStatus, FailedLookupMessage?: string}> {
    let resolvedInputs = (component.Inputs ? component.Inputs : []) as
        Array<{Key: string, Value: string, FailedLookupStatus?: Deployment.ComponentDeploymentStatus, FailedLookupMessage?: string}>;

    if(resolvedInputs) {
        for(var j = 0; j < resolvedInputs.length; j++) {
            let input = resolvedInputs[j];
            let match = input.Value.match(LOOKUP_PATTERN);
            if(match) {
                let inputValueSplit = match[1].split(':');

                let componentEnv = inputValueSplit[0];
                let componentName = inputValueSplit[1];
                let variableName = inputValueSplit[2];

                if(componentEnv === observation.data.Env && componentName === observation.data.Name) {
                    const output = observation.data.Outputs?.find(out => out.Key === variableName);
                    if(output) {
                        resolvedInputs[j].Value = output.Value
                    } else if (observation.data.Status === 'DELETED') { 
                        resolvedInputs[j].FailedLookupStatus = 'DEPLOYMENT_FAILED';
                        resolvedInputs[j].FailedLookupMessage = `Dependent component ${componentName} is in deleted state`;
                    } else {
                        resolvedInputs[j].FailedLookupStatus = 'DEPLOYMENT_FAILED';
                        resolvedInputs[j].FailedLookupMessage = `Dependent component ${componentName} was missing output value for ${variableName}`;
                    }
                } else {
                    resolvedInputs[j].FailedLookupStatus = 'WAITING_ON_DEPENDENT_DEPLOYMENT';
                }
            }
        }
    }
    return resolvedInputs;
}

function lookupComponentOutput(
    componentEnv: string,
    componentName: string,
    variableName: string,
    dependentComponents: Observation2<Component.EntityObservation>[]
): string {
    console.log('lookupComponentOutput args', componentEnv, componentName, variableName, dependentComponents);
    for(var dependentComponent of dependentComponents) {
        if(dependentComponent.entityid === `${componentEnv}:${componentName}`) {
            console.log('lookupComponentOutput componentFound', componentName, dependentComponent);
            if(dependentComponent.data.Outputs) {
                for(var output of dependentComponent.data.Outputs) {
                    if(output.Key === variableName) {
                        console.log('lookupComponentOutput return', componentName, variableName, output)
                        return  output.Value;
                    }
                }
            }
            throw new OutputNotFoundError(dependentComponent, variableName);
        }
    }
    throw new ComponentNotFoundError(componentEnv, componentName);
}

export class OutputNotFoundError extends Error {
    constructor(component: Observation2<Component.EntityObservation>, varName: string, ...params) {
        super(...params);

        this.name = "OutputNotFoundError";
        this.message = `Failed to find output (${varName}) for component ${component.data.Env}:${component.data.Name}`;
    }
}

export class ComponentNotFoundError extends Error {
    constructor(environment: string, componenentName: string, ...params) {
        super(...params);

        this.name = "ComponentNotFoundError";
        this.message = `Failed to find component ${environment}:${componenentName}`;
    }
}