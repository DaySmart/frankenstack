import { Context } from 'o18k-ts-aws';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { Policy } from '../Entities/Policy';
import { PutPolicyMutation } from '../Entities/PutPolicyMutation';
import { createNewObservation, Observation2 } from '../Observation2';
const equal = require('deep-equal');

export default function PolicyDecider_PutPolicyMutationHandler(
	observation: Observation2<PutPolicyMutation.EntityObservation>,
	dependentObservations: Observation2<IEntityObservation>[][],
	_context: Context
): Observation2<Policy.EntityObservation>[] {
	const decisions: Observation2<IEntityObservation>[] = [];

	const dependentPolicyObservations = dependentObservations.find(observations =>
		observations.every(obs => obs.entity === Policy.ENTITY_NAME)
	) as Observation2<Policy.EntityObservation>[];

	const policy: Policy.DataSchema = {
		PolicyName: observation.data.PolicyName,
		Statements: observation.data.Statements
	};

	if (dependentPolicyObservations.length > 0) {
		const previousPolicy = dependentPolicyObservations[0];

		if (equal(previousPolicy.data.Statements, policy.Statements)) {
			return decisions;
		}
	}

	decisions.push(createNewObservation(Policy.EntityObservation, policy, observation.traceid));

	return decisions;
}
