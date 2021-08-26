import { Context, IEntityObservation, Observation2 } from "o18k-ts-aws";
import { Component } from "../Entities/Component";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { ComponentRollbackQuery } from "../Entities/ComponentRollbackQuery";

export function ComponentRollbackQueryResponseHandler(
  _observation: Observation2<ComponentRollbackQuery.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): any {
  if (!dependentObservations || !dependentObservations.length) {
    return {};
  }

  const componentResults = dependentObservations[0] as Observation2<Component.EntityObservation>[];
  if (!componentResults || componentResults.length !== 2) {
    return {};
  }
  const component: Component.EntityObservation = componentResults[1];

  const componentDeploymentResults = dependentObservations[1] as Observation2<ComponentDeployment.EntityObservation>[];
  if (!componentDeploymentResults || componentDeploymentResults.length === 1) {
    return {};
  }
  const componentDeployment: ComponentDeployment.EntityObservation | undefined = componentDeploymentResults.find(
    obs => obs.data.DeploymentGuid === component.data.DeploymentGuid
  );

  if (!componentDeployment) {
    return {};
  }

  return {
    deploymentGuid: componentDeployment.data.DeploymentGuid,
    env: componentDeployment.data.Env,
    name: componentDeployment.data.Name,
    provider: {
      name: componentDeployment.data.Provider.Name,
      config: componentDeployment.data.Provider.Config
        ? componentDeployment.data.Provider.Config.map(configItem => {
            return {
              name: configItem.Key,
              value: configItem.Value
            };
          })
        : undefined
    },
    inputs: componentDeployment.data.Inputs
      ? componentDeployment.data.Inputs.map(input => {
          return {
            name: input.Key,
            value: input.Value
          };
        })
      : undefined,
    outputs: component.data.Outputs
      ? component.data.Outputs.map(output => {
          return {
            name: output.Key,
            value: output.Value
          };
        })
      : undefined
  };
}
