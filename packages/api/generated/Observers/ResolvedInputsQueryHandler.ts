import { createExistingObservation, generateTraceId, Observation2 } from "o18k-ts-aws";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { ResolvedInputsQuery } from "../Entities/ResolvedInputsQuery";

export default function(event, _context): Observation2<IEntityObservation>[] {
  const observations: Observation2<IEntityObservation>[] = [];
  const data = event.arguments;

  const resolvedInputsQuery: ResolvedInputsQuery.DataSchema = {
    Env: data.env,
    Component: {
      Name: data.component.name,
      Provider: {
        Name: data.component.provider.name,
        Config: data.component.provider.config
          ? data.component.provider.config.map(config => {
              return {
                Key: config.name,
                Value: config.value
              };
            })
          : undefined
      },
      Inputs: data.component.inputs
        ? data.component.inputs.map(input => {
            return {
              Key: input.name,
              Value: input.value
            };
          })
        : undefined,
      Outputs: data.component.outputs
        ? data.component.outputs.map(output => {
            return {
              Key: output.name,
              Value: output.value
            };
          })
        : undefined
    }
  };

  const observation = new ResolvedInputsQuery.EntityObservation(resolvedInputsQuery);

  observations.push(
    createExistingObservation(
      observation,
      generateTraceId(),
      new Date().toISOString(),
      "0.1",
      ResolvedInputsQuery.ENTITY_NAME,
      "sometypeofinstanceid"
    )
  );

  return observations;
}
