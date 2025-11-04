import { IEntityObservation } from './IEntityObservation';

export namespace ComponentDeployment {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.componentdeployment';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export interface DataSchema {
		DeploymentGuid: string;
		Env: string;
		Name: string;
		Provider: Provider;
		Inputs?: Array<{Key: string; Value: string}>;
		Outputs?: Array<{Key: string; Value: string}>;
		Error?: string;
		Method?: string;
	}

	export interface Provider {
		Name: string;
		Compute?: 'LAMBDA' | 'CODE_BUILD';
		ResourceArn?: string;
		Account?: Account;
		Config?: Array<{Key: string; Value: string}>;
	}

	export interface Account {
		accountId: string;
		credentials: string;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = `${this.data.DeploymentGuid}:${this.data.Env}:${this.data.Name}`;

			if(!this.data.Provider.Config) {
				this.data.Provider.Config = [];
			}
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}
}