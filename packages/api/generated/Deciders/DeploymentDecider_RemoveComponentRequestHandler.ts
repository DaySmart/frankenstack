import { Context } from "o18k-ts-aws";
import { Deployment } from "../Entities/Deployment";
import { DeploymentRequest } from '../Entities/DeploymentRequest';
import { IEntityObservation } from "../Entities/IEntityObservation";
import { Policy } from "../Entities/Policy";
import { RemoveComponentRequest } from "../Entities/RemoveComponentRequest";
import { createNewObservation, Observation2 } from "../Observation2";
import { validateActionAllowedByPolicies } from '../../src/utils/policyValidation';
import { getComponentDependentsForRemoveComponentRequest } from "../../src/utils/parseInputs";

export default function DeploymentDecider_RemoveComponentRequest(
    observation: Observation2<RemoveComponentRequest.EntityObservation>,
    dependentObservations: Observation2<IEntityObservation>[][],
    _context: Context
): Observation2<Deployment.EntityObservation>[] {
    const decisions: Observation2<Deployment.EntityObservation>[] = [];

    const data = observation.data;

    const dependentDeployments = dependentObservations.find(observations =>
        observations.every(obs => obs.entity === Deployment.ENTITY_NAME)
    ) as Observation2<Deployment.EntityObservation>[];

    const dependentDeploymentRequestObservations = dependentObservations.find(observations => {
        if(observations.length === 0) return false;
        return observations.every(obs => obs ? obs.entity === DeploymentRequest.ENTITY_NAME : false)
    }) as Observation2<DeploymentRequest.EntityObservation>[];

    const dependentPolicyObservations = dependentObservations.find(observations =>
        observations.every(obs => obs.entity === Policy.ENTITY_NAME)
    ) 

    if(dependentDeployments){
        const components: Array<Deployment.Component> = data.ComponentDeployments.map(lastComponentDeployment => {
            const lastDeploymentObservation = dependentDeployments.find(deployment => deployment.data.DeploymentGuid === lastComponentDeployment.LastDeploymentGuid);
            if(lastDeploymentObservation) {
                const latestComponent = lastDeploymentObservation.data.Components.find(component => component.Name === lastComponentDeployment.ComponentName);
                if(latestComponent) {
                    let providerConfig = latestComponent.Provider.Config ? latestComponent.Provider.Config : []; 
                    providerConfig.push(
                        {
                            Key: "artifactOverideGuid",
                            Value: lastDeploymentObservation.data.DeploymentGuid
                        }
                    );

                    let status: Deployment.ComponentDeploymentStatus = "ACCEPTED";
                    let statusReason: string[] = [];
                    if(!validateActionAllowedByPolicies(
                        'deploy:write',
                        data.Env,
                        lastComponentDeployment.ComponentName,
                        dependentPolicyObservations || []
                    )) {
                        status = 'UNAUTHORIZED';
                        statusReason.push(`${data.User} is not authorized to perform deploy:write on ${data.Env}:${lastComponentDeployment.ComponentName}`);
                    }

                    const dependentComponentNames = getComponentDependentsForRemoveComponentRequest(data.Env, lastComponentDeployment.ComponentName, data.ComponentDeployments, dependentDeploymentRequestObservations)
                    if(dependentComponentNames.length > 0) {
                       status = 'WAITING_ON_DEPENDENT_DEPLOYMENT';
                    }

                    return {
                        Name: lastComponentDeployment.ComponentName,
                        Provider: {
                            Name: latestComponent.Provider.Name,
                            Config: providerConfig
                        },
                        Status: status,
                        Inputs: latestComponent.Inputs,
                        Outputs: latestComponent.Outputs,
                        StatusReason: statusReason,
                        DependsOn: dependentComponentNames
                    }
                } else {
                    throw `Could not find ${lastComponentDeployment.ComponentName} in deployment ${lastDeploymentObservation.data.DeploymentGuid}`;
                }
            } else {
                throw `Could not find deployment ${lastComponentDeployment.LastDeploymentGuid}`;
            } 
        })

        const deployment: Deployment.DataSchema = {
            DeploymentGuid: observation.data.DeploymentGuid,
            Env: data.Env,
            Start: new Date().toISOString(),
            User: data.User,
            Status: 'DEPLOY_IN_PROGRESS',
            Components: components,
            Method: "remove"
        }
        decisions.push(createNewObservation(Deployment.EntityObservation, deployment, observation.traceid));
    }
    return decisions;
}
