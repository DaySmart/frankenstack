import { createExistingObservation, generateTraceId, Observation2 } from "o18k-ts-aws";
import { RemoveComponentMutation } from "../Entities/RemoveComponentMutation";
import { IEntityObservation } from "../Entities/IEntityObservation";
import parseUserFromAppsyncUser from "../../src/utils/parseUserFromAppsyncUser";

export default function(event, _context): Observation2<IEntityObservation>[] {
  const observations: Observation2<IEntityObservation>[] = [];
  const data = event.arguments;

  const iamUser = parseUserFromAppsyncUser(event);

  const removeComponentMutation: RemoveComponentMutation.DataSchema = {
    Env: data.env,
    ComponentName: data.componentName,
    ComponentNames: data.componentNames,
    User: iamUser,
    DeploymentGuid: data.deploymentGuid
  };

  const observation = new RemoveComponentMutation.EntityObservation(removeComponentMutation);

  observations.push(
    createExistingObservation(
      observation,
      generateTraceId(),
      new Date().toISOString(),
      "0.1",
      RemoveComponentMutation.ENTITY_NAME,
      "sometypeofinstanceid"
    )
  );

  return observations;
}