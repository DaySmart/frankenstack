import { IEntityObservation } from './IEntityObservation';

export namespace Component {
    export const ENTITY_NAME = "daysmart.environmentservice.api.component";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";

    type DeploymentResult = "DEPLOYED" | "DEPLOYMENT_FAILED" | "DELETED"

    export interface DataSchema {
        DeploymentGuid: string;
        Env: string;
        Name: string;
        Outputs?: Array<{Key: string, Value: string}>;
        Status: DeploymentResult;
        Create: string;
        Update: string;
    }

    export class EntityObservation implements IEntityObservation {
        constructor(data: DataSchema) {
            this.data = data;
            this.entityid = `${this.data.Env}:${this.data.Name}`;
        }

        entity = ENTITY_NAME;
        type = TYPE;
        schema = SCHEMA;
        dataref = DATAREF;

        data: DataSchema;
        entityid: string;
    }
}