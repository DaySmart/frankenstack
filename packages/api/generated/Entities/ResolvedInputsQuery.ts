import { Component } from './DeploymentTemplate';
import { IEntityObservation } from './IEntityObservation';

export namespace ResolvedInputsQuery {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.resolvedinputsquery';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export interface DataSchema {
		Env: string;
		Component: Component;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = `${data.Env}:${data.Component.Name}`;
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}
}