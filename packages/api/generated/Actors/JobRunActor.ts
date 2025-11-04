import { Context, IEntityObservation } from "o18k-ts-aws";
import { v4 as uuidv4 } from "uuid";
import { CodeBuildClient } from "../../src/services/CodeBuild";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { Observation2 } from "../Observation2";
import { Lambda } from "aws-sdk";

const lambda = new Lambda();

export default async function JobRunActor(
  observation: Observation2<ComponentDeployment.EntityObservation>,
  _dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Promise<any> {
  const data = observation.data;

  const jobRunGuid = uuidv4();
  let awsResourceArn: string | undefined;

  let type: string;

  if(observation.data.Error) {
    console.log("[JobRunAction] ComponentDeployment includes error", { action: "JobRunAction", observation });
    type = observation.data.Provider.Compute === "LAMBDA" ? 'LAMBDA' : 'CODEBUILD';
    return {
      jobRunGuid,
      type,
      error: observation.data.Error
    }
  }

  let error;
  if (observation.data.Provider.Compute === "LAMBDA") {
    if (!observation.data.Provider.ResourceArn) {
      console.log("[JobRunAction] missing lambda resource ARN", { action: "JobRunAction", observation });
      return;
    }

    awsResourceArn = observation.data.Provider.ResourceArn;

    try {
      await lambda
        .invokeAsync({
          FunctionName: observation.data.Provider.ResourceArn,
          InvokeArgs: JSON.stringify({
            deploymentGuid: observation.data.DeploymentGuid,
            environment: observation.data.Env,
            componentName: observation.data.Name,
            jobRunGuid: jobRunGuid,
            componentProvider: data.Provider,
            inputs: observation.data.Inputs,
            logGroup: process.env.JOB_RUN_CLOUDWATCH_LOG_GROUP,
          })
        })
        .promise();
    } catch (err) {
      console.error(err);
      error = err as string;
    }
    type = "LAMBDA";
  } else {
    let buildDir;
    let nodejsVersion: number | undefined = undefined;
    let artifactOverideGuid;
    if (data.Provider.Config) {
      console.log("[action] providerConfig", data.Provider.Config);
      const buildDirItems = data.Provider.Config.filter(item => item.Key === "buildDir");
      if (buildDirItems.length > 0) {
        buildDir = buildDirItems[0].Value;
      }
      const nodejsVersionItems = data.Provider.Config.filter(
        (item) => item.Key === "nodejsVersion"
      );
      if (nodejsVersionItems.length > 0 && !isNaN(parseInt(nodejsVersionItems[0].Value))) {
        nodejsVersion = parseInt(nodejsVersionItems[0].Value);
      }

      const artifactOverideGuidItems = data.Provider.Config.filter(item => item.Key === "artifactOverideGuid");
      if (artifactOverideGuidItems.length > 0) {
        artifactOverideGuid = artifactOverideGuidItems[0].Value;
      }
    }
    console.log("[action] buildDir", { builddir: buildDir });
    console.log("[action] nodejsVersion", { nodejsversion: nodejsVersion });

    try {
      const codeBuildTriggerResponse = await CodeBuildClient.triggerCodeBuild(
        {
          jobRunGuid: jobRunGuid,
          componentEnvironment: data.Env,
          componentInputs: JSON.stringify(data.Inputs),
          componentName: data.Name,
          componentProvider: JSON.stringify(data.Provider),
          componentProviderName: data.Provider.Name,
          deploymentGuid: data.DeploymentGuid,
          buildDir: buildDir ? buildDir : undefined,
          nodejsVersion: nodejsVersion ? nodejsVersion : undefined,
          artifactOverideGuid: artifactOverideGuid
            ? artifactOverideGuid
            : undefined,
          Method: data.Method,
        },
        console.log
      );

      awsResourceArn = codeBuildTriggerResponse.build?.arn;

      console.log("[action] codeBuildTriggerResponse", { codeBuildTriggerResponse });
    } catch(err) {
      console.error(err);
      error = err as string;
    }
    type = "CODEBUILD";
  }

  return { jobRunGuid, type, awsResourceArn, error, env:data.Env };
}
