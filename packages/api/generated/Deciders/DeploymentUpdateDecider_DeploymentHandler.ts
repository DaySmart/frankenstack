import { Context } from "o18k-ts-aws";
import { Component } from "../Entities/Component";
import { Deployment } from "../Entities/Deployment";
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { createNewObservation, Observation2 } from "../Observation2";

export default function DeploymentUpdateDecider_DeploymentHandler(
  observation: Observation2<Deployment.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<DeploymentUpdate.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  const data = observation.data;
  const allComponentsDeployed = data.Components.every(component => ["DEPLOYED", "DEPLOYMENT_FAILED", "UNAUTHORIZED"].includes(component.Status as string));
  const deploymentFailed = data.Components.filter(component => ["DEPLOYMENT_FAILED", "UNAUTHORIZED"].includes(component.Status as string)).length > 0;

  if (allComponentsDeployed) {
    const dependentComponentObservations: Observation2<Component.EntityObservation>[] = dependentObservations[0];

    let message = "Deployment Complete!";
    message = message.concat(
      ...data.Components.map(component => {
        let componentMessage = `\n${component.Status} ${component.Name}`;
        if(component.StatusReason) {
          componentMessage = componentMessage.concat(...component.StatusReason.map(reason => `\n${reason}`));
        }
        let dependentComponent = dependentComponentObservations.find(componentObs => componentObs.data.Name === component.Name);
        if (dependentComponent && dependentComponent.data.Outputs && dependentComponent.data.Outputs.length > 0) {
          componentMessage = componentMessage.concat("\nOutputs:");
          componentMessage = componentMessage.concat(...dependentComponent.data.Outputs.map(output => `\n${output.Key}: ${output.Value}`));
        }
        componentMessage = componentMessage.concat("\n");
        return componentMessage;
      })
    );
    const deploymentUpdate: DeploymentUpdate.DataSchema = {
      DeploymentGuid: data.DeploymentGuid,
      Message: message,
      Type: deploymentFailed ? "ERROR" : "DONE"
    };

    decisions.push(createNewObservation(DeploymentUpdate.EntityObservation, deploymentUpdate, observation.traceid));
  }

  //   log("[handler] results", {
  //     handler: "DeploymentHandler",
  //     decider: "DeploymentUpdateDecider",
  //     observation: this.observation,
  //     decisions
  //   });

  return decisions;
}
