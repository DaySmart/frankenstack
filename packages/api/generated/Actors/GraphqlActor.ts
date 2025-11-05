import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { Observation2 } from "../Observation2";
import { EnvironmentServiceAppSyncClient } from "@daysmart/frankenstack-appsync-client";
import AWS from "aws-sdk";
import { DeploymentUpdateMutationVariables } from "@daysmart/frankenstack-appsync-client/src/graphql/types";
import { Context, IEntityObservation } from "o18k-ts-aws";
const ssmConfig = require("../../src/services/SSMConfig");
require("isomorphic-fetch");

let awsconfig: any;

export default async function GraphqlActor(
  observation: Observation2<DeploymentUpdate.EntityObservation>,
  _dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Promise<any> {
  //   this.log("[action] start", {
  //     action: "GraphqlAction",
  //     observation
  //   });

  const data = observation.data;

  const deploymentUpdateObservation: DeploymentUpdateMutationVariables = {
    deploymentGuid: data.DeploymentGuid,
    message: data.Message.replace(/\n/g, "\\n").replace('"', '"'),
    type: data.Type,
    moreInfoComponentName: data.MoreInfoComponentName,
    moreInfoKey: data.MoreInfoKey,
    moreInfoType: data.MoreInfoType,
    componentName: data.ComponentName,
    jobRunGuid: data.JobRunGuid,
    status: data.Status,
  };
  if(!awsconfig) {
    awsconfig = await ssmConfig(process.env.STAGE);
  }
  //   console.log(AWS.config.credentials);
  const client = new EnvironmentServiceAppSyncClient(awsconfig, AWS.config.credentials);

  const deploymentUpdateResponse = await client.deploymentUpdate(deploymentUpdateObservation);
  return { deploymentUpdateResponse };

  //   this.log("[action] result", {
  //     action: "GraphqlAction",
  //     result: resp
  //   });
}
