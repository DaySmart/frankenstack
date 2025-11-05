import { JobRunUpdate } from "../Entities/JobRunUpdate";
import { createNewObservation, Observation2 } from "../Observation2";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { JobRun } from "../Entities/JobRun";
import { Context } from "o18k-ts-aws";

export default function DeploymentUpdateDecider_JobRunUpdateHandler(
  observation: Observation2<JobRunUpdate.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<DeploymentUpdate.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  //   log("[callHandler] dependentObservations", { dependentObservations });
  const data = observation.data;

  const jobRuns = dependentObservations[0] as Observation2<
    JobRun.EntityObservation
  >[];
  if (jobRuns[0]) {
    const jobRun = jobRuns[0] as Observation2<JobRun.EntityObservation>;

    const deploymentUpdate: DeploymentUpdate.DataSchema = {
      DeploymentGuid: jobRun.data.DeploymentGuid,
      ComponentName: jobRun.data.ComponentName,
      JobRunGuid: jobRun.data.JobRunGuid,
      Status: "IN_PROGRESS",
      Message: data.Message.replace("\n", ""),
      Type: "INFO",
    };

    decisions.push(
      createNewObservation(
        DeploymentUpdate.EntityObservation,
        deploymentUpdate,
        observation.traceid
      )
    );
  }

  //   log("[handler] results", {
  //     handler: "JobRunUpdateHandler",
  //     decider: "DeploymentUpdateDecider",
  //     observation: this.observation,
  //     decisions
  //   });

  return decisions;
}
