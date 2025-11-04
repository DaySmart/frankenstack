
import { Context } from 'o18k-ts-aws';
import { createNewObservation, Observation2 } from '../Observation2';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { DeploymentForm } from '../Entities/DeploymentForm';
import { DeploymentRequest } from '../Entities/DeploymentRequest';
import { User } from '../Entities/User';

export default function DeploymentRequestDecider_DeploymentFormHandler(
	observation: Observation2<DeploymentForm.EntityObservation>,
	dependentObservations: Observation2<IEntityObservation>[][],
	_context: Context
): Observation2<DeploymentRequest.EntityObservation>[] {
	const decisions: Observation2<DeploymentRequest.EntityObservation>[] = [];

	const lastDeployments = dependentObservations[0] as Observation2<DeploymentRequest.EntityObservation>[];
	const data = observation.data;

	const userObservations = dependentObservations[1] as Observation2<User.EntityObservation>[];
	let policyNames: Array<string> = [];
	if(userObservations.length > 0) {
		policyNames = userObservations[0].data.PolicyNames;
	}

	if(lastDeployments.length === 0) {
		const deploymentRequest: DeploymentRequest.DataSchema = {
			Env: data.Env,
			DeploymentGuid: data.DeploymentGuid,
			Components: data.Components,
			User: data.User,
			PolicyNames: policyNames
		};

		decisions.push(createNewObservation(DeploymentRequest.EntityObservation, deploymentRequest, observation.traceid));
	}
	return decisions;
}