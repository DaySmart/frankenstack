import { Context, IEntityObservation, Observation2 } from "o18k-ts-aws";
import { DeploymentRequest } from "../Entities/DeploymentRequest";
import { GetDeploymentRequestQuery } from "../Entities/GetDeploymentRequestQuery";

export function GetDeploymentRequestQueryResponseHandler(
  _observation: Observation2<GetDeploymentRequestQuery.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): any {

    if (!dependentObservations || !dependentObservations.length) {
        return {};
    }

    const deploymentRequestResults = dependentObservations[0] as Observation2<DeploymentRequest.EntityObservation>[];

    if(deploymentRequestResults && deploymentRequestResults[0]){
        const deploymentRequest = deploymentRequestResults[0];
        return {
            env: deploymentRequest.data.Env,
            user: deploymentRequest.data.User,
            policyNames: deploymentRequest.data.PolicyNames,
            components: deploymentRequest.data.Components.map(component => {
                return {
                    name: component.Name,
                    provider: {
                        name: component.Provider.Name,
                        config: component.Provider.Config ? (component.Provider.Config.map(config => {
                            return {
                                name: config.Key,
                                value: config.Value
                            }
                        })) : undefined
                    },
                    inputs: component.Inputs ? (component.Inputs.map(input => {
                        return {
                            name: input.Key,
                            value: input.Value
                        }
                    })) : undefined
                }
            })
        };
    }

}
