import { Context } from "o18k-ts-aws";
import { Component } from "../Entities/Component";
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { createNewObservation, Observation2 } from "../Observation2";

export default function DeploymentUpdateDecider_ComponentHandler(
  observation: Observation2<Component.EntityObservation>,
  _dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<DeploymentUpdate.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  //   log("[callHandler] dependentObservations", { dependentObservations });
  const data = observation.data;

  const deploymentUpdate: DeploymentUpdate.DataSchema = {
    DeploymentGuid: data.DeploymentGuid,
    Message: "Component finished deploying",
    Type: "COMPONENT_DONE"
  };

  decisions.push(createNewObservation(DeploymentUpdate.EntityObservation, deploymentUpdate, observation.traceid));

  //   log("[handler] results", {
  //     handler: "ComponentHandler",
  //     decider: "DeploymentUpdateDecider",
  //     observation,
  //     decisions
  //   });

  return decisions;
}
