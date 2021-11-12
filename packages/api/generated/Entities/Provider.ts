import { IEntityObservation } from "./IEntityObservation";

export namespace Provider {
  export const ENTITY_NAME = "daysmart.environmentservice.api.provider";

  export const SCHEMA = "schemaurl";
  export const TYPE = "full";
  export const DATAREF = "datarefurl";

  export type ProviderCompute = "CODE_BUILD" | "LAMBDA";

  export interface DataSchema {
    Name: string;
    Version: string;
    Compute: ProviderCompute;
    ResourceArn: string;
	//add property for custom configs
  }

  export class EntityObservation implements IEntityObservation {
    constructor(data: DataSchema) {
      this.data = data;
      this.entityid = this.data.Name;
    }

    entity = ENTITY_NAME;
    type = TYPE;
    schema = SCHEMA;
    dataref = DATAREF;

    data: DataSchema;
    entityid: string;
  }
}
