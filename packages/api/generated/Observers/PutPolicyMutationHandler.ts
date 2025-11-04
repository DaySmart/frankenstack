import { PutPolicyMutation } from '../Entities/PutPolicyMutation';
import { createExistingObservation, generateTraceId, Observation2 } from '../Observation2';

export default function(event, _context): Observation2<PutPolicyMutation.EntityObservation>[] {
	const observations: Observation2<PutPolicyMutation.EntityObservation>[] = [];
	const data = event.arguments;

	const putPolicyMutation: PutPolicyMutation.DataSchema = {
		PolicyName: data.policyName,
		Statements: data.statements.map(statement => ({
			Effect: statement.effect,
			Actions: statement.actions,
			Resources: statement.resources
		}))
	};

	const observation = new PutPolicyMutation.EntityObservation(putPolicyMutation);

	observations.push(
		createExistingObservation(observation, generateTraceId(), new Date().toISOString(), '0.1', PutPolicyMutation.ENTITY_NAME, 'sometypeofinstanceid')
	);

	return observations;
}
