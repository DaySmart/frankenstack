import { createExistingObservation, generateTraceId, Observation2 } from "o18k-ts-aws";
import { GetDeploymentRequestQuery } from '../Entities/GetDeploymentRequestQuery';
import { IEntityObservation } from "../Entities/IEntityObservation";

export default function(event, _context): Observation2<IEntityObservation>[] {
  const observations: Observation2<IEntityObservation>[] = [];
  const data = event.arguments;

  const getDeploymentRequestQuery: GetDeploymentRequestQuery.DataSchema = {
      DeploymentGuid: data.deploymentGuid
  }

  const observation = new GetDeploymentRequestQuery.EntityObservation(getDeploymentRequestQuery);

  observations.push(
    createExistingObservation(
      observation,
      generateTraceId(),
      new Date().toISOString(),
      "0.1",
      GetDeploymentRequestQuery.ENTITY_NAME,
      "sometypeofinstanceid"
    )
  );

  return observations;
}
