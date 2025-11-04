import { IEntityObservation } from './IEntityObservation';

export namespace JobRunFinished {
	export const ENTITY_NAME = 'daysmart.environmentservice.api.jobrunfinished';

	export const SCHEMA = 'schemaurl';
	export const TYPE = 'full';
	export const DATAREF = 'datarefurl';

    type DeploymentResult = 'Success' | 'Failed' | 'Deleted';

    export interface DataSchema {
    	JobRunGuid: string;
    	DeploymentGuid: string;
    	Env: string;
    	Name: string;
    	Outputs?: Array<{Key: string; Value: string}>;
    	Status: DeploymentResult;
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