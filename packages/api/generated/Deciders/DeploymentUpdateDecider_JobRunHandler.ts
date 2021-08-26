import { Context } from "o18k-ts-aws";
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { JobRun } from "../Entities/JobRun";
import { createNewObservation, Observation2 } from "../Observation2";

export default function DeploymentUpdateDecider_JobRunHandler(
  observation: Observation2<JobRun.EntityObservation>,
  _dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<DeploymentUpdate.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  //   log("[callHandler] dependentObservations", { dependentObservations });
  const data = observation.data;
  
  let message: string;
  if(data.Error) {
    message = `Deployment of ${data.ComponentName} FAILED!\n${data.Error}`
  } else {
    message = data.AWSResourceArn ? `Deployment of ${data.ComponentName} initialized on ${data.AWSResourceArn}` :
    `Deployment of ${data.ComponentName} initialized`;
  }
  
  const deploymentUpdate: DeploymentUpdate.DataSchema = {
    DeploymentGuid: data.DeploymentGuid,
    Message: message,
    Type: "INFO"
  };

  decisions.push(createNewObservation(DeploymentUpdate.EntityObservation, deploymentUpdate, observation.traceid));

  //   log("[handler] results", {
  //     handler: "ComponentHandler",
  //     decider: "DeploymentUpdateDecider",
  //     observation: this.observation,
  //     decisions
  //   });

  return decisions;
}
