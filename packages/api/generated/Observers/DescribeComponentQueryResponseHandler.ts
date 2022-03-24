import { Context, IEntityObservation, Observation2 } from "o18k-ts-aws";
import { Component } from "../Entities/Component";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { DescribeComponentQuery } from "../Entities/DescribeComponentQuery";

export function DescribeComponentQueryResponseHandler(
  _observation: Observation2<DescribeComponentQuery.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): any {
  if (!dependentObservations || !dependentObservations.length) {
    return {};
  }

  const componentResults = dependentObservations[0] as Observation2<Component.EntityObservation>[];
  if (!componentResults || componentResults.length !== 1) {
    return {};
  }
  const component: Component.EntityObservation = componentResults[0];

  const componentDeploymentResults = dependentObservations[1] as Observation2<ComponentDeployment.EntityObservation>[];
  if (!componentDeploymentResults) {
    return {};
  }
  const componentDeployment: ComponentDeployment.EntityObservation | undefined = componentDeploymentResults.find(
    obs => obs.data.DeploymentGuid === component.data.DeploymentGuid
  );

  if (!componentDeployment) {
    return {};
  }

  return {
    deploymentGuid: component.data.DeploymentGuid,
    env: component.data.Env,
    name: component.data.Name,
    status: component.data.Status,
    create: component.data.Create,
    update: component.data.Update,
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
