import { IEntityObservation } from './IEntityObservation';

export namespace RemoveComponentRequest {
    export const ENTITY_NAME = "daysmart.environmentservice.api.removecomponentrequest";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";


    export interface DataSchema {
        Env: string;
        DeploymentGuid: string;
        User: string;
        PolicyNames: Array<string>
        ComponentDeployments: Array<LastComponentDeployment>;
    }

    export interface LastComponentDeployment {
        ComponentName: string;
        LastDeploymentGuid: string;
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