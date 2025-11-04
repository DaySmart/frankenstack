import { createExistingObservation, generateTraceId, IEntityObservation, Observation2 } from 'o18k-ts-aws';
import { ProviderFailure } from '../../generated/Entities/ProviderFailure';

export default function ProviderFailureHandler(event, _context): Observation2<IEntityObservation>[] {
	const observations: Observation2<IEntityObservation>[] = [];
	const data = event.detail;

	const providerFailure: ProviderFailure.DataSchema = {
		AWSResourceArn: data['build-id'],
		Error: `Error in CodeBuild Job ${data['build-id']}`
	};

	const observation = new ProviderFailure.EntityObservation(providerFailure);

	observations.push(
		createExistingObservation(
			observation,
			generateTraceId(),
			new Date().toISOString(),
			'0.1',
			'daysmart.environmentservice.api.providerfailure',
			'sometypeofinstanceid'
		)
	);

	return observations;
}
