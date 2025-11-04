import { Context } from 'o18k-ts-aws';
import { resolveReferenceFromComponentObservation } from '../../src/utils/parseInputs';
import { Component } from '../Entities/Component';
import { Deployment } from '../Entities/Deployment';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { createNewObservation, Observation2 } from '../Observation2';

export default function DeploymentDecider_ComponentHandler(
	observation: Observation2<Component.EntityObservation>,
	dependentObservations: Observation2<IEntityObservation>[][],
	_context: Context
): Observation2<Deployment.EntityObservation>[] {
	const decisions: Observation2<IEntityObservation>[] = [];

	//   log("[callHandler DeploymentDecider_ComponentHandler] dependentObservations", { dependentObservations });
	const latestDeployment = dependentObservations[0][0] as Deployment.EntityObservation;

	const deployment: Deployment.DataSchema = {
		Components: latestDeployment.data.Components.map(component => {
			if(component.Name === observation.data.Name) {
				return { ...component, Status: observation.data.Status };
			} else {
				if(component.Status === 'WAITING_ON_DEPENDENT_DEPLOYMENT') {
					let status: Deployment.ComponentDeploymentStatus = component.Status;
					const statusReason: string[] = [];

					const resolvedInputs = resolveReferenceFromComponentObservation(
						observation,
						component
					);

					resolvedInputs.forEach(input => {
						if(input.FailedLookupMessage && !statusReason.includes(input.FailedLookupMessage)) {
							statusReason.push(input.FailedLookupMessage);
						}
					});

					let dependentComponents = component.DependsOn || [];
					if(resolvedInputs.find(input => input.FailedLookupStatus === 'DEPLOYMENT_FAILED')) {
						status = 'DEPLOYMENT_FAILED';
					} else if (resolvedInputs.find(input => input.FailedLookupStatus === 'WAITING_ON_DEPENDENT_DEPLOYMENT')) {
						status = 'WAITING_ON_DEPENDENT_DEPLOYMENT';
					} else {
						if(latestDeployment.data.Method && latestDeployment.data.Method === 'remove') {
							if(component.DependsOn) {
								dependentComponents = component.DependsOn.filter(dependent => dependent !== observation.data.Name);
							}
							status = dependentComponents.length === 0 ? 'ACCEPTED' : 'WAITING_ON_DEPENDENT_DEPLOYMENT';
						} else {
							status = 'ACCEPTED';
						}
					}

					return {
						...component,
						Inputs: resolvedInputs.map(input => ({
							Key: input.Key,
							Value: input.Value
						})),
						Status: status,
						StatusReason: statusReason,
						DependsOn: dependentComponents
					};
				} else {
					return component;
				}
			}
		}),
		DeploymentGuid: observation.data.DeploymentGuid,
		Env: observation.data.Env,
		Start: latestDeployment.data.Start,
		User: latestDeployment.data.User,
		Status: latestDeployment.data.Status,
		Method: latestDeployment.data.Method
	};

	if(deployment.Components.every(component => component.Status === 'DEPLOYED' || component.Status === 'DELETED')) {
		deployment.Status = 'DEPLOYED';
		deployment.Finish = new Date().toISOString();
	} else if (deployment.Components.every(component => ['DEPLOYED', 'DEPLOYMENT_FAILED', 'UNAUTHORIZED', 'DELETED'].includes(component.Status as string))) {
		deployment.Status = 'DEPLOYMENT_FAILED';
		deployment.Finish = new Date().toISOString();
	}

	decisions.push(createNewObservation(Deployment.EntityObservation, deployment, observation.traceid));

	//   log("[handler] results", {
	//     handler: "ComponentHandler",
	//     decider: "DeploymentDecider",
	//     observation: observation,
	//     decisions
	//   });

	return decisions;
}
