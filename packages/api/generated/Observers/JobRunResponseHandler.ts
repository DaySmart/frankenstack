import { createNewObservation, Observation2 } from "o18k-ts-aws";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { JobRun } from "../Entities/JobRun";

export default function JobRunResponseHandler(
  observation: Observation2<ComponentDeployment.EntityObservation>,
  response: any
): Observation2<JobRun.EntityObservation>[] {
  if (!response || !response.jobRunGuid) {
    throw new Error("JobRunGuid not found.");
  }

  const jobRun = createNewObservation(
    JobRun.EntityObservation,
    {
      JobRunGuid: response.jobRunGuid,
      DeploymentGuid: observation.data.DeploymentGuid,
      ComponentName: observation.data.Name,
      Type: response.type,
      CloudWatchLogGroup: process.env.JOB_RUN_CLOUDWATCH_LOG_GROUP as string,
      CloudWatchLogStream: response.jobRunGuid,
      AWSResourceArn: response.awsResourceArn,
      Error: response.error
      
    },
    observation.traceid
  );
  return [jobRun];
}
