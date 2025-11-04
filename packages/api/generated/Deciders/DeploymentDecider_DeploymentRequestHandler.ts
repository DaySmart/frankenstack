import { Context } from 'o18k-ts-aws';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { DeploymentRequest } from '../Entities/DeploymentRequest';
import { createNewObservation, Observation2 } from '../Observation2';
import { Component } from '../Entities/Component';
import { resolveReferencesForDeploymentRequestComponent } from '../../src/utils/parseInputs';
import { Policy } from '../Entities/Policy';
import { ComponentDeployment } from '../Entities/ComponentDeployment';
import { validateActionAllowedByPolicies } from '../../src/utils/policyValidation';
import { Deployment } from '../Entities/Deployment';

export default function DeploymentDecider_DeploymentRequestHandler(
	observation: Observation2<DeploymentRequest.EntityObservation>,
	dependentObservations: Observation2<IEntityObservation>[][],
	_context: Context
): Observation2<Deployment.EntityObservation>[] {
	const decisions: Observation2<IEntityObservation>[] = [];

	const dependentComponentObservations = dependentObservations.find(observations => {
		if (observations.length === 0) {
			return false;
		}
		return observations.every(obs => obs ? obs.entity === Component.ENTITY_NAME : false);
	}) as Observation2<Component.EntityObservation>[];

	const data = observation.data;

	const dependentPolicyObservations = dependentObservations.find(observations => {
		if(observations.length === 0) {
			return false;
		}
		return observations.every(obs => obs ? obs.entity === Policy.ENTITY_NAME : false);
	}) as Observation2<Policy.EntityObservation>[];

	const deployment: Deployment.DataSchema = {
		Env: data.Env,
		DeploymentGuid: data.DeploymentGuid,
		User: data.User,
		Start: new Date().toISOString(),
		Components: data.Components.map((component: DeploymentRequest.Component): Deployment.Component => {
			let status: Deployment.ComponentDeploymentStatus = 'ACCEPTED';
			const statusReason: string[] = [];

			const dependantComponentDeployments: Observation2<IEntityObservation>[] = [];
			for (const observations of dependentObservations) {
				for (const obs of observations) {
					if (obs.entity === ComponentDeployment.ENTITY_NAME && obs.entityid === `${data.DeploymentGuid}:${data.Env}:${component.Name}`) {
						dependantComponentDeployments.push(obs);
					}
				}
			}
			if(dependantComponentDeployments.length > 0) {
				status = 'DEPLOY_IN_PROGRESS';
			}

			const resolvedInputs = resolveReferencesForDeploymentRequestComponent(
				observation,
				component,
				dependentComponentObservations || []
			);

			resolvedInputs.forEach(input => {
				if(input.FailedLookupMessage && !statusReason.includes(input.FailedLookupMessage)) {
					statusReason.push(input.FailedLookupMessage);
				}
			});

			if(resolvedInputs.find(input => input.FailedLookupStatus === 'DEPLOYMENT_FAILED')) {
				status = 'DEPLOYMENT_FAILED';
			} else if (resolvedInputs.find(input => input.FailedLookupStatus === 'WAITING_ON_DEPENDENT_DEPLOYMENT')) {
				status = 'WAITING_ON_DEPENDENT_DEPLOYMENT';
			}

			if(!validateActionAllowedByPolicies(
				'deploy:write',
				data.Env,
				component.Name,
				dependentPolicyObservations || []
			)) {
				status = 'UNAUTHORIZED';
				statusReason.push(`${data.User} is not authorized to perform deploy:write on ${data.Env}:${component.Name}`);
			}

			return {
				Name: component.Name,
				Provider: component.Provider,
				Inputs: resolvedInputs.map(input => ({
					Key: input.Key,
					Value: input.Value
				})),
				Outputs: component.Outputs,
				Status: status,
				StatusReason: statusReason
			};
		}),
		Status: 'DEPLOY_IN_PROGRESS'
	};

	if(deployment.Components.every(component => ['DEPLOYMENT_FAILED', 'UNAUTHORIZED'].includes(component.Status))) {
		deployment.Status = 'DEPLOYMENT_FAILED';
	}

	decisions.push(
		createNewObservation(
			Deployment.EntityObservation,
			deployment,
			observation.traceid
		)
	);

	return decisions;
}
