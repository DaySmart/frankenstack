import { Context } from 'o18k-ts-aws';
import { Component } from '../Entities/Component';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { RemoveComponentMutation } from '../Entities/RemoveComponentMutation';
import { RemoveComponentRequest } from '../Entities/RemoveComponentRequest';
import { createNewObservation, Observation2 } from '../Observation2';
import { User } from '../Entities/User';

export default function RemoveComponentRequestDecider_RemoveComponentMutationHandler(
	observation: Observation2<RemoveComponentMutation.EntityObservation>,
	dependentObservations: Observation2<IEntityObservation>[][],
	_context: Context
): Observation2<RemoveComponentRequest.EntityObservation>[] {
	const decisions: Observation2<IEntityObservation>[] = [];

	const data = observation.data;

	const dependentComponents = dependentObservations.find(observations =>
		observations.every(obs => obs.entity === Component.ENTITY_NAME)
	) as Observation2<Component.EntityObservation>[];

	const userObservations = dependentObservations[1] as Observation2<User.EntityObservation>[];
	let policyNames: Array<string> = [];
	if(userObservations.length > 0) {
		policyNames = userObservations[0].data.PolicyNames;
	}

	const componentNames: Array<string> = [];
	if(data.ComponentName) {
		componentNames.push(data.ComponentName);
	}
	if(data.ComponentNames) {
		componentNames.push(...data.ComponentNames);
	}

	if(dependentComponents) {
		const lastComponentDeployments: Array<RemoveComponentRequest.LastComponentDeployment> = componentNames.map(componentName => {
			const lastComponentObservation = dependentComponents.find(component => component.data.Name === componentName);
			if(lastComponentObservation) {
				return {
					ComponentName: componentName,
					LastDeploymentGuid: lastComponentObservation.data.DeploymentGuid
				};
			} else {
				throw `Could not find component ${componentName}`;
			}
		});

		const removeComponentRequest: RemoveComponentRequest.DataSchema = {
			Env: data.Env,
			ComponentDeployments: lastComponentDeployments,
			User: data.User,
			DeploymentGuid: data.DeploymentGuid,
			PolicyNames: policyNames
		};

		decisions.push(createNewObservation(RemoveComponentRequest.EntityObservation, removeComponentRequest, observation.traceid));
	}

	return decisions;
}