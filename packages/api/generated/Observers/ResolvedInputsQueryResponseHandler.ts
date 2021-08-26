import { Context, IEntityObservation, Observation2 } from "o18k-ts-aws";
import { replaceComponentInputLookups } from "../../src/utils/parseInputs";
import { Component } from "../Entities/Component";
import { ComponentRollbackQuery } from "../Entities/ComponentRollbackQuery";

export function ResolvedInputsQueryResponseHandler(
  observation: Observation2<ComponentRollbackQuery.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): any {
  const components = dependentObservations[0] as Observation2<Component.EntityObservation>[];

  const resolvedObservation = replaceComponentInputLookups(observation, components);
  // log("[graphqlRequestObserver] resolvedInputsObservation", { resolvedObservation }, event, context);
  return resolvedObservation.data.Component.Inputs.map(input => {
    return { name: input.Key, value: input.Value };
  });
}
