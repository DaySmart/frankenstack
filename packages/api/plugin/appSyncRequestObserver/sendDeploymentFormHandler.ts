import { IEntityObservation } from "../../generated/Entities/IEntityObservation";
import { DeploymentForm } from "../../generated/Entities/DeploymentForm";
import { createExistingObservation, generateTraceId, Observation2 } from "../../generated/Observation2";

export default function(data): Observation2<IEntityObservation>[] {
    const observations: Observation2<IEntityObservation>[] = [];
    const deploymentForm = {
        Env: data.template.env,
        DeploymentGuid: data.deploymentGuid,
        Components: data.template.components.map(component => {
            return {
                Name: component.name,
                Provider: {
                    Name: component.provider.name,
                    Config: component.provider.config ? component.provider.config.map(config => {
                        return {
                            Key: config.name,
                            Value: config.value
                        }
                    }) : undefined
                },
                Inputs: component.inputs ? component.inputs.map(input => {
                    return {
                        Key: input.name,
                        Value: input.value
                    }
                }) : undefined,
                Outputs: component.outputs ? component.outputs.map(output => {
                    return {
                        Key: output.name,
                        Value: output.value
                    }
                }) : undefined
            }
        })
    }

    const observation = new DeploymentForm.EntityObservation(deploymentForm);
    
    observations.push(
        createExistingObservation(
            observation,
            generateTraceId(),
            (new Date()).toISOString(),
            "0.1",
            "daysmart.environmentservice.api.deploymentform",
            "sometypeofinstanceid"
        )
    );

    return observations;
}