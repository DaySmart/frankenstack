import { IEntityObservation } from './IEntityObservation';

export namespace PutUserMutation {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.putusermutation';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export interface DataSchema {
		UserId: string;
		Email?: string;
		Policies: Array<string>;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = this.data.UserId;
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}

}