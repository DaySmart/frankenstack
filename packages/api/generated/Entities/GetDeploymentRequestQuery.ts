import { IEntityObservation } from './IEntityObservation';

export namespace GetDeploymentRequestQuery {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.getdeploymentrequestquery';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export interface DataSchema {
		DeploymentGuid: string;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = data.DeploymentGuid;
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}
}