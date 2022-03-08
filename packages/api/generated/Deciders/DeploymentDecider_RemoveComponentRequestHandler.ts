import { Context } from "o18k-ts-aws";
import { Deployment } from "../Entities/Deployment";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { Policy } from "../Entities/Policy";
import { RemoveComponentRequest } from "../Entities/RemoveComponentRequest";
import { createNewObservation, Observation2 } from "../Observation2";
import { validateActionAllowedByPolicies } from '../../src/utils/policyValidation';

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
    if(dependentDeployments && dependentDeployments[0]){
        const latestDeployment = dependentDeployments[0];
        const latestComponent = latestDeployment.data.Components.find(component =>
            component.Name === data.ComponentName);
        if(!latestComponent){
            return decisions;
        }
        let providerConfig = latestComponent.Provider.Config ? latestComponent.Provider.Config : []; 
        providerConfig.push(
            {
                Key: "artifactOverideGuid",
                Value: latestDeployment.data.DeploymentGuid
            }
        )
        const dependentPolicyObservations = dependentObservations.find(observations =>
            observations.every(obs => obs.entity === Policy.ENTITY_NAME)
            ) 
        let status: Deployment.ComponentDeploymentStatus = "ACCEPTED";
        let statusReason: string[] = [];
        if(!validateActionAllowedByPolicies(
            'deploy:write',
            data.Env,
            data.ComponentName,
            dependentPolicyObservations || []
        )) {
            status = 'UNAUTHORIZED';
            statusReason.push(`${data.User} is not authorized to perform deploy:write on ${data.Env}:${data.ComponentName}`);
        }


        const deployment: Deployment.DataSchema = {
            DeploymentGuid: observation.data.DeploymentGuid,
            Env: latestDeployment.data.Env,
            Start: latestDeployment.data.Start,
            User: data.User,
            Status: 'DEPLOY_IN_PROGRESS',
            Components: [{
                Name: latestComponent.Name,
                Provider: {
                    Name: latestComponent.Provider.Name,
                    Config: providerConfig
                },
                Status: status,
                Inputs: latestComponent.Inputs,
                Outputs: latestComponent.Outputs,
                StatusReason: statusReason,
            }],
            Method: "remove"
        }
        decisions.push(createNewObservation(Deployment.EntityObservation, deployment, observation.traceid));
    }
    return decisions;
}
