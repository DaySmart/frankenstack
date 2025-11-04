import { IEntityObservation } from './IEntityObservation';

export namespace ProviderFailure {
    export const ENTITY_NAME = "daysmart.environmentservice.api.providerfailure";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";

    export interface DataSchema {
        AWSResourceArn: string;
        Error?: string;
    }

    export class EntityObservation implements IEntityObservation {
        constructor(data: DataSchema) {
            this.data = data;
            this.entityid = this.data.AWSResourceArn;
        }

        entity = ENTITY_NAME;
        type = TYPE;
        schema = SCHEMA;
        dataref = DATAREF;

        data: DataSchema;
        entityid: string;
    }
}