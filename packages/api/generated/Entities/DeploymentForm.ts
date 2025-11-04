import { IEntityObservation } from './IEntityObservation';

export namespace DeploymentForm {
    export const ENTITY_NAME = "daysmart.environmentservice.api.deploymentform";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";

    export interface DataSchema {
        Env: string;
        DeploymentGuid: string;
        Components: Array<Component>
        User?: string;
    }

    interface Component {
        Name: string;
        Provider: Provider;
        Inputs?: Array<{Key: string, Value: string}>;
        Outputs?: Array<{Key: string, Value: string}>;
    }

    interface Provider {
        Name: string;
        Config?: Array<{Key: string, Value: string}>;
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
