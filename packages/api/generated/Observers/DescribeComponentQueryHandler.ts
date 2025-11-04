import { createExistingObservation, generateTraceId, Observation2 } from 'o18k-ts-aws';
import { DescribeComponentQuery } from '../Entities/DescribeComponentQuery';
import { IEntityObservation } from '../Entities/IEntityObservation';

export default function(event, _context): Observation2<IEntityObservation>[] {
	const observations: Observation2<IEntityObservation>[] = [];
	const data = event.arguments;

	const describeComponentQuery: DescribeComponentQuery.DataSchema = {
		Env: data.env,
		ComponentName: data.componentName
	};

	const observation = new DescribeComponentQuery.EntityObservation(describeComponentQuery);

	observations.push(
		createExistingObservation(
			observation,
			generateTraceId(),
			new Date().toISOString(),
			'0.1',
			DescribeComponentQuery.ENTITY_NAME,
			'sometypeofinstanceid'
		)
	);

	return observations;
}
