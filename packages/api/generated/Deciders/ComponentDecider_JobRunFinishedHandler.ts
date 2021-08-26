import { Context } from "o18k-ts-aws";
import { Component } from "../Entities/Component";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { JobRunFinished } from "../Entities/JobRunFinished";
import { createNewObservation, Observation2 } from "../Observation2";

export default function ComponentDecider_JobRunFinishedHandler(
  observation: Observation2<JobRunFinished.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<Component.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  //   log("[callHandler] dependentObservations", { dependentObservations });

  const data = observation.data;

  var createdTime = new Date().toISOString();
  var previousOutputs: { Key: string; Value: string }[] = [];
  if (dependentObservations[0]) {
    const topComponentObservation = dependentObservations[0] as Observation2<Component.EntityObservation>[];
    if (topComponentObservation[0]) {
      createdTime = topComponentObservation[0].data.Create;
      previousOutputs = topComponentObservation[0].data.Outputs || [];
    }
  }

  let componentStatus;
  switch (data.Status) {
    case "Success":
      componentStatus = "DEPLOYED";
      break;
    default:
      componentStatus = "DEPLOYMENT_FAILED";
  }

  const component: Component.DataSchema = {
    DeploymentGuid: data.DeploymentGuid,
    Env: data.Env,
    Name: data.Name,
    Status: componentStatus,
    Outputs: componentStatus === "DEPLOYMENT_FAILED" && (!data.Outputs || data.Outputs.length === 0) ? previousOutputs : data.Outputs,
    Create: createdTime,
    Update: new Date().toISOString()
  };

  decisions.push(createNewObservation(Component.EntityObservation, component, observation.traceid));

  //   log("[handler] results", {
  //     handler: "JobRunFinishedHandler",
  //     decider: "ComponentDecider",
  //     observation: this.observation,
  //     decisions
  //   });
  return decisions;
}
