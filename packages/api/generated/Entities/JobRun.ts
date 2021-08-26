import { IEntityObservation } from './IEntityObservation';

export namespace JobRun {
    export const ENTITY_NAME = "daysmart.environmentservice.api.jobrun";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";

    type DeploymentType = "LAMBDA" | "CODEBUILD" | "ECS";

    export interface DataSchema {
        JobRunGuid: string;
        DeploymentGuid: string;
        ComponentName: string;
        Type: DeploymentType;
        CloudWatchLogGroup: string;
        CloudWatchLogStream: string;
        AWSResourceArn?: string;
        Error?: string;
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