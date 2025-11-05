import { IEntityObservation } from './IEntityObservation';

export namespace DeploymentUpdate {
    export const ENTITY_NAME = "daysmart.environmentservice.api.deploymentupdate";

    export const SCHEMA = "schemaurl";
    export const TYPE = "full";
    export const DATAREF = "datarefurl";

    type DeploymentUpdateType = "INFO" | "NEED_INPUT" | "DONE" | "COMPONENT_DONE" | "ERROR";
    type MoreInfoType = "PROVIDER" | "INPUT";

    export interface DataSchema {
      DeploymentGuid: string;
      Type: DeploymentUpdateType;
      Message: string;
      MoreInfoComponentName?: string;
      MoreInfoType?: MoreInfoType;
      MoreInfoKey?: string;
      ComponentName?: string;
      JobRunGuid?: string;
      Status?: string;
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
