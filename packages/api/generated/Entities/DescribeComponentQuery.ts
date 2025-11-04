import { IEntityObservation } from './IEntityObservation';

export namespace DescribeComponentQuery {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.describecomponentquery';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export interface DataSchema {
		Env: string;
		ComponentName: string;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = `${data.Env}:${data.ComponentName}`;
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}
}