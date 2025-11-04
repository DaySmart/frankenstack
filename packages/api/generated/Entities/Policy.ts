import { IEntityObservation } from './IEntityObservation';

export namespace Policy {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.policy';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export interface DataSchema {
		PolicyName: string;
		Statements: Array<Statement>;
	}

	export interface Statement {
		Effect: 'Allow' | 'Deny';
		Actions: Array<string>;
		Resources: Array<string>;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = this.data.PolicyName;
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}

}