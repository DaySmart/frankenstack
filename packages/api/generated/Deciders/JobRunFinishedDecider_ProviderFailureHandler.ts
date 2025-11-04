import { Context } from "o18k-ts-aws";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { JobRun } from "../Entities/JobRun";
import { JobRunFinished } from "../Entities/JobRunFinished";
import { ProviderFailure } from "../Entities/ProviderFailure";
import { createNewObservation, Observation2 } from "../Observation2";

export default function JobRunFinishedDecider_ProviderFailureHandler(
  observation: Observation2<ProviderFailure.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<JobRunFinished.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  const jobRuns = dependentObservations[0] as Observation2<JobRun.EntityObservation>[];
  if (jobRuns[0]) {
    const jobRun = jobRuns[0] as Observation2<JobRun.EntityObservation>;
    const jobRunFinished: JobRunFinished.DataSchema = {
        JobRunGuid: jobRun.data.JobRunGuid,
        DeploymentGuid: jobRun.data.DeploymentGuid,
        Env: jobRun.data.Env,
        Name: jobRun.data.ComponentName,
        Status: "Failed"
    }
  
    decisions.push(createNewObservation(JobRunFinished.EntityObservation, jobRunFinished, observation.traceid));
  }

  return decisions;
}
