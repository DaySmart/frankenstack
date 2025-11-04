import { IEntityObservation } from '../../generated/Entities/IEntityObservation';
import { ResolvedInputsQuery } from '../../generated/Entities/ResolvedInputsQuery';
import { createExistingObservation, generateTraceId, Observation2 } from '../../generated/Observation2';

export default function(data): Observation2<IEntityObservation>[] {
	const observations: Observation2<IEntityObservation>[] = [];

	const resolvedInputsQuery: ResolvedInputsQuery.DataSchema = {
		Env: data.env,
		Component: {
			Name: data.component.name,
			Provider: {
				Name: data.component.provider.name,
				Config: data.component.provider.config ? data.component.provider.config.map(config => ({
					Key: config.name,
					Value: config.value
				})) : undefined
			},
			Inputs: data.component.inputs ? data.component.inputs.map(input => ({
				Key: input.name,
				Value: input.value
			})) : undefined,
			Outputs: data.component.outputs ? data.component.outputs.map(output => ({
				Key: output.name,
				Value: output.value
			})) : undefined
		}
	};

	const observation = new ResolvedInputsQuery.EntityObservation(resolvedInputsQuery);

	observations.push(
		createExistingObservation(
			observation,
			generateTraceId(),
			(new Date()).toISOString(),
			'0.1',
			ResolvedInputsQuery.ENTITY_NAME,
			'sometypeofinstanceid'
		)
	);

	return observations;
}