import { IEntityObservation } from './IEntityObservation';

export namespace Deployment {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.deployment';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

	export type DeploymentStatus =
        'DEPLOY_IN_PROGRESS' |
        'DEPLOYED' |
        'DELETED' |
        'DEPLOYMENT_FAILED';

	export type ComponentDeploymentStatus = DeploymentStatus |
	'ACCEPTED' |
	'UNAUTHORIZED' |
	'WAITING_ON_DEPENDENT_DEPLOYMENT';

	export interface DataSchema {
		Env: string;
		DeploymentGuid: string;
		Components: Array<Component>;
		Start?: string;
		Finish?: string;
		User: string;
		Status: DeploymentStatus;
		Method?: string;
	}

	export interface Component {
		Name: string;
		Provider: Provider;
		Inputs?: Array<{Key: string; Value: string}>;
		Outputs?: Array<{Key: string; Value: string}>;
		Status: ComponentDeploymentStatus;
		StatusReason?: Array<string>;
		DependsOn?: Array<string>;
	}

	interface Provider {
		Name: string;
		Config?: Array<{Key: string; Value: string}>;
	}

	export class EntityObservation implements IEntityObservation {
		constructor(data: DataSchema) {
			this.data = data;
			this.entityid = this.data.DeploymentGuid;
		}

		entity = ENTITY_NAME;
		type = TYPE;
		schema = SCHEMA;
		dataref = DATAREF;

		data: DataSchema;
		entityid: string;
	}
}