import { createExistingObservation, generateTraceId, IEntityObservation, Observation2 } from 'o18k-ts-aws';
import { JobRunFinished } from '../../generated/Entities/JobRunFinished';

export default function JobRunFinishedHandler(event, _context): Observation2<IEntityObservation>[] {
	const observations: Observation2<IEntityObservation>[] = [];
	const data = JSON.parse(event.Records[0].Sns.Message);

	const jobFinished: JobRunFinished.DataSchema = {
		DeploymentGuid: data.deploymentGuid,
		Env: data.env,
		JobRunGuid: data.jobRunGuid,
		Name: data.name,
		Status: data.status,
		Outputs: JSON.parse(data.outputs)
	};

	const observation = new JobRunFinished.EntityObservation(jobFinished);

	observations.push(
		createExistingObservation(
			observation,
			generateTraceId(),
			new Date().toISOString(),
			'0.1',
			'daysmart.environmentservice.api.jobrunfinished',
			'sometypeofinstanceid'
		)
	);

	return observations;
}
