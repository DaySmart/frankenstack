import { IEntityObservation } from './IEntityObservation';

export namespace User {
    export const ENTITY_NAME = "daysmart.environmentservice.api.user";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";

    export interface DataSchema {
        UserId: string;
        IdentityArn?: string;
        Email?: string;
        PolicyNames: Array<string>;
    }

    export class EntityObservation implements IEntityObservation {
        constructor(data: DataSchema) {
            this.data = data;
            this.entityid = this.data.UserId;
        }

        entity = ENTITY_NAME;
        type = TYPE;
        schema = SCHEMA;
        dataref = DATAREF;

        data: DataSchema;
        entityid: string;
    }

}