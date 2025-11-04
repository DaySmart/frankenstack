import { IEntityObservation } from './IEntityObservation';

export namespace JobRunUpdate {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.jobrunupdate';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export interface DataSchema {
		JobRunGuid: string;
		CloudWatchGroupName: string;
		CloudWatchLogStream: string;
		Message: string;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = this.data.JobRunGuid;
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}
}