import { IEntityObservation } from './IEntityObservation';

export namespace RemoveComponentMutation {
    export const ENTITY_NAME = "daysmart.environmentservice.api.removecomponentmutation";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";

    export interface DataSchema {
        Env: string;
        ComponentName?: string;
        ComponentNames?: Array<string>;
        User: string;
        DeploymentGuid: string;
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