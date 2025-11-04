import { PutUserMutation } from '../Entities/PutUserMutation';
import { createExistingObservation, generateTraceId, Observation2 } from '../Observation2';

export default function(event, _context): Observation2<PutUserMutation.EntityObservation>[] {
	const observations: Observation2<PutUserMutation.EntityObservation>[] = [];
	const data = event.arguments;

	const putUserMutation: PutUserMutation.DataSchema = {
		UserId: data.userId,
		Email: data.email,
		Policies: data.policies
	};

	const observation = new PutUserMutation.EntityObservation(putUserMutation);

	observations.push(
		createExistingObservation(observation, generateTraceId(), new Date().toISOString(), '0.1', PutUserMutation.ENTITY_NAME, 'sometypeofinstanceid')
	);

	return observations;
}
