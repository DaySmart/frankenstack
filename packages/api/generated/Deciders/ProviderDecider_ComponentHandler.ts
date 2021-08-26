import { Context } from "o18k-ts-aws";
import { Component } from "../Entities/Component";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { Provider } from "../Entities/Provider";
import { createNewObservation, Observation2 } from "../Observation2";

export default function ProviderDecider_ComponentHandler(
  observation: Observation2<Component.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<Provider.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  // log("[callHandler] dependentObservations", { dependentObservations });

  const data = observation.data;

  const dependentComponentDeployments = dependentObservations.find(observations =>
    observations.every(obs => obs.entity === ComponentDeployment.ENTITY_NAME)
  ) as Observation2<ComponentDeployment.EntityObservation>[];

  if (data.Env !== "provider") {
    console.log("[providerDecider] returning due to component env isn't provider", {});
    return [];
  }

  if (!data.Outputs) {
    console.log("[providerDecider] returning due to no component outputs", {});
    return [];
  }

  if (!dependentComponentDeployments || !dependentComponentDeployments.length) {
    console.log("[providerDecider] returning due to no dependentComponentDeployments", {});
    return [];
  }

  const componentDeployment = dependentComponentDeployments[0];

  if (!componentDeployment.data.Inputs) {
    console.log("[providerDecider] returning due to no component deployment inputs", {});
    return [];
  }

  let resoureArnOutput = data.Outputs.find(output => output.Key === "ResourceArn");

  if (!resoureArnOutput) {
    console.log("[providerDecider] returning due to resourceArnOutput not found", {});
    return [];
  }

  const computeInput = componentDeployment.data.Inputs.find(input => input.Key === "compute");

  const versionInput = componentDeployment.data.Inputs.find(input => input.Key === "version");

  const provider: Provider.DataSchema = {
    Compute: computeInput && computeInput.Value in ["LAMBDA", "CODE_BUILD"] ? (computeInput.Value as Provider.ProviderCompute) : "LAMBDA",
    Name: data.Name,
    ResourceArn: resoureArnOutput.Value,
    Version: versionInput ? versionInput.Value : "0.1"
  };

  decisions.push(createNewObservation(Provider.EntityObservation, provider, observation.traceid));

  // log("[handler] results", {
  //   handler: "ComponentHandler",
  //   decider: "ProviderDecider",
  //   observation: this.observation,
  //   decisions
  // });

  return decisions;
}
