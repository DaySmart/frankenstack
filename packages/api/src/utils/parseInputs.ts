import { Component } from '../../generated/Entities/Component';
import { Deployment } from '../../generated/Entities/Deployment';
import { DeploymentRequest } from '../../generated/Entities/DeploymentRequest';
import { IEntityObservation } from '../../generated/Entities/IEntityObservation';
import { RemoveComponentRequest } from '../../generated/Entities/RemoveComponentRequest';
import { ResolvedInputsQuery } from '../../generated/Entities/ResolvedInputsQuery';
import { Observation2 } from '../../generated/Observation2';


const LOOKUP_PATTERN = new RegExp(/\$\{(.*?)\}/);

export function getComponentLookup(observation: Observation2<IEntityObservation>): Array<string> {
	let componentNames: Array<string> = [];
	console.log('getComponentLookup args', observation);
	if(observation.entity === DeploymentRequest.ENTITY_NAME) {
		for(const component of observation.data.Components) {
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

function matchInput(input: {Key: string; Value: string}, componentNames: Array<string>): Array<string> {
	// Can't log this because it could log secrets
	// console.log('matchInput args', input, componentNames);
	const match = input.Value.match(LOOKUP_PATTERN);
	if(match) {
		const lookupParams = match[1].split(':');
		const componentName = `${lookupParams[0]}:${lookupParams[1]}`;
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
		for(const input of component.Inputs) {
			const match = input.Value.match(LOOKUP_PATTERN);
			if(match) {
				inputsResolved = false;
			}
		}
	}
	return inputsResolved;
}

export function getComponentDependentsForRemoveComponentRequest(environment: string, componentName: string, lastComponentDeployments: Array<RemoveComponentRequest.LastComponentDeployment>, dependentDeploymentRequestObservations: Array<DeploymentRequest.EntityObservation>): Array<string> {
	const dependentComponentNames: Array<string> = [];
	lastComponentDeployments.forEach(lastComponentDeployment => {
		const lastDeployment = dependentDeploymentRequestObservations.find(deployment => deployment.data.DeploymentGuid === lastComponentDeployment.LastDeploymentGuid);
		if(lastDeployment) {
			const lastDeploymentComponent = lastDeployment.data.Components.find(component => component.Name === lastComponentDeployment.ComponentName);
			if(lastDeploymentComponent && lastDeploymentComponent.Inputs) {
				const dependentComponents = lastDeploymentComponent.Inputs.filter(input => {
					const match = input.Value.match(LOOKUP_PATTERN);
					if(match) {
						const lookupParams = match[1].split(':');
						const lookupEnvironment = lookupParams[0];
						const lookupComponentName = lookupParams[1];
						if(lookupEnvironment === environment && lookupComponentName === componentName) {
							return true;
						}
					}
					return false;
				});
				if(dependentComponents && dependentComponents.length > 0) {
					dependentComponentNames.push(lastDeploymentComponent.Name);
				}
			}
		}
	});
	return dependentComponentNames;
}

export function replaceComponentInputLookups(
	observation: Observation2<IEntityObservation>,
	dependentComponents: Observation2<Component.EntityObservation>[]
): Observation2<IEntityObservation> {
	if(observation.entity === Deployment.ENTITY_NAME) {
		const componentsInTemplate = observation.data.Components.map(component => component.Name);
		for(let i = 0; i < observation.data.Components.length; i++) {
			const component = observation.data.Components[i];
			if(['DEPLOY_IN_PROGRESS', 'DEPLOYED', 'DEPLOYMENT_FAILED'].includes(component.Status as string)) {
				continue;
			}
			if(component.Inputs) {
				for(var j = 0; j < component.Inputs.length; j++) {
					const input = component.Inputs[j];
					const match = input.Value.match(LOOKUP_PATTERN);
					if(match) {
						const inputValueSplit = match[1].split(':');
						const lookupEnvironment = inputValueSplit[0];
						const lookupComponentName = inputValueSplit[1];

						if(
							observation.data.Env === lookupEnvironment &&
                            componentsInTemplate.includes(lookupComponentName)
						) {
							const inTemplateComponent = observation.data.Components.find(component => component.Name === lookupComponentName);
							if(inTemplateComponent && inTemplateComponent.Status !== 'DEPLOYED') {
								continue;
							}
						}
						const variableName = inputValueSplit[2];
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
				const input = observation.data.Component.Inputs[j];
				const match = input.Value.match(LOOKUP_PATTERN);
				if(match) {
					const inputValueSplit = match[1].split(':');

					const componentEnv = inputValueSplit[0];
					const componentName = inputValueSplit[1];
					const variableName = inputValueSplit[2];

					observation.data.Component.Inputs[j].Value = lookupComponentOutput(
						componentEnv,
						componentName,
						variableName,
						dependentComponents
					);
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
): Array<{Key: string; Value: string; FailedLookupStatus?: Deployment.ComponentDeploymentStatus; FailedLookupMessage?: string}> {
	const resolvedInputs = (component.Inputs ? component.Inputs : []) as
        Array<{Key: string; Value: string; FailedLookupStatus?: Deployment.ComponentDeploymentStatus; FailedLookupMessage?: string}>;

	const componentsInTemplate = observation.data.Components.map(component => component.Name);
	if(resolvedInputs) {
		for(let j = 0; j < resolvedInputs.length; j++) {
			const input = resolvedInputs[j];
			const match = input.Value.match(LOOKUP_PATTERN);
			if(match) {
				const inputValueSplit = match[1].split(':');

				const componentEnv = inputValueSplit[0];
				const componentName = inputValueSplit[1];
				const variableName = inputValueSplit[2];

				if(componentEnv === observation.data.Env && componentsInTemplate.includes(componentName)) {
					resolvedInputs[j].FailedLookupStatus = 'WAITING_ON_DEPENDENT_DEPLOYMENT';
					resolvedInputs[j].FailedLookupMessage = `Dependency found on component in template: ${componentEnv}:${componentName}`;
				} else {
					try {
						resolvedInputs[j].Value = lookupComponentOutput(
							componentEnv,
							componentName,
							variableName,
							dependentComponentObservations
						);
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
): Array<{Key: string; Value: string; FailedLookupStatus?: Deployment.ComponentDeploymentStatus; FailedLookupMessage?: string}> {
	const resolvedInputs = (component.Inputs ? component.Inputs : []) as
        Array<{Key: string; Value: string; FailedLookupStatus?: Deployment.ComponentDeploymentStatus; FailedLookupMessage?: string}>;

	if(resolvedInputs) {
		for(let j = 0; j < resolvedInputs.length; j++) {
			const input = resolvedInputs[j];
			const match = input.Value.match(LOOKUP_PATTERN);
			if(match) {
				const inputValueSplit = match[1].split(':');

				const componentEnv = inputValueSplit[0];
				const componentName = inputValueSplit[1];
				const variableName = inputValueSplit[2];

				if(componentEnv === observation.data.Env && componentName === observation.data.Name) {
					const output = observation.data.Outputs?.find(out => out.Key === variableName);
					if(output) {
						resolvedInputs[j].Value = output.Value;
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
	for(const dependentComponent of dependentComponents) {
		if(dependentComponent.entityid === `${componentEnv}:${componentName}`) {
			console.log('lookupComponentOutput componentFound', componentName, dependentComponent);
			if(dependentComponent.data.Outputs) {
				for(const output of dependentComponent.data.Outputs) {
					if(output.Key === variableName) {
						console.log('lookupComponentOutput return', componentName, variableName, output);
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

		this.name = 'OutputNotFoundError';
		this.message = `Failed to find output (${varName}) for component ${component.data.Env}:${component.data.Name}`;
	}
}

export class ComponentNotFoundError extends Error {
	constructor(environment: string, componenentName: string, ...params) {
		super(...params);

		this.name = 'ComponentNotFoundError';
		this.message = `Failed to find component ${environment}:${componenentName}`;
	}
}