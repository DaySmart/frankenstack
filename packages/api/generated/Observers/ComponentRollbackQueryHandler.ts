import { createExistingObservation, generateTraceId, Observation2 } from 'o18k-ts-aws';
import { ComponentRollbackQuery } from '../Entities/ComponentRollbackQuery';
import { IEntityObservation } from '../Entities/IEntityObservation';

export default function(event, _context): Observation2<IEntityObservation>[] {
	const observations: Observation2<IEntityObservation>[] = [];
	const data = event.arguments;

	const componentRollbackQuery: ComponentRollbackQuery.DataSchema = {
		Env: data.env,
		ComponentName: data.componentName
	};

	const observation = new ComponentRollbackQuery.EntityObservation(componentRollbackQuery);

	observations.push(
		createExistingObservation(
			observation,
			generateTraceId(),
			new Date().toISOString(),
			'0.1',
			ComponentRollbackQuery.ENTITY_NAME,
			'sometypeofinstanceid'
		)
	);

	return observations;
}
