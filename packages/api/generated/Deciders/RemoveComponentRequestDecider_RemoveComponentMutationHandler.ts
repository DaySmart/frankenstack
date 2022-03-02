import { Context } from "o18k-ts-aws";
import { Component } from "../Entities/Component";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { RemoveComponentMutation } from "../Entities/RemoveComponentMutation";
import { RemoveComponentRequest } from "../Entities/RemoveComponentRequest";
import { createNewObservation, Observation2 } from "../Observation2";
import { User } from "../Entities/User";

export default function RemoveComponentRequestDecider_RemoveComponentMutationHandler(
    observation: Observation2<RemoveComponentMutation.EntityObservation>,
    dependentObservations: Observation2<IEntityObservation>[][],
    _context: Context
  ): Observation2<RemoveComponentRequest.EntityObservation>[] {
    const decisions: Observation2<IEntityObservation>[] = [];
    
    const data = observation.data;

    const dependentComponents = dependentObservations.find(observations =>
        observations.every(obs => obs.entity === Component.ENTITY_NAME)
      ) as Observation2<Component.EntityObservation>[];

      const userObservations = dependentObservations[1] as Observation2<User.EntityObservation>[]
    let policyNames: Array<string> = [];
    if(userObservations.length > 0) {
        policyNames = userObservations[0].data.PolicyNames;
    }

      if (dependentComponents && dependentComponents[0]){
          const component = dependentComponents[0] as Component.EntityObservation;

          const removeComponentRequest: RemoveComponentRequest.DataSchema = {
            Env: data.Env,
            ComponentName: data.ComponentName,
            User: data.User,
            DeploymentGuid: data.DeploymentGuid,
            LastDeploymentGuid: component.data.DeploymentGuid,
            PolicyNames: policyNames
        }
      
        decisions.push(createNewObservation(RemoveComponentRequest.EntityObservation, removeComponentRequest, observation.traceid));
      }


      return decisions;

}