import { Context } from "o18k-ts-aws";
import { lookupProviderAccountFromAccountComponents } from "../../src/utils/providerLookups";
import { Component } from "../Entities/Component";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { Deployment } from "../Entities/Deployment";
import { IEntityObservation } from "../Entities/IEntityObservation";
import { Provider } from "../Entities/Provider";
import { createNewObservation, Observation2 } from "../Observation2";

export default function ComponentDeploymentDecider_DeploymentHandler(
  observation: Observation2<Deployment.EntityObservation>,
  dependentObservations: Observation2<IEntityObservation>[][],
  _context: Context
): Observation2<ComponentDeployment.EntityObservation>[] {
  const decisions: Observation2<IEntityObservation>[] = [];

  const data = observation.data;

  const dependentProviderObservations: Observation2<Provider.EntityObservation>[] | undefined = dependentObservations.find(observations => {
    if (observations.length === 0) {
      return false;
    }
    return observations.every(obs => {
      return obs ? obs.entity === Provider.ENTITY_NAME : false;
    });
  });

  const providers = dependentProviderObservations?.map(obs => obs.data);

  const dependentComponentDeploymentObservations: Observation2<ComponentDeployment.EntityObservation>[] | undefined = dependentObservations.find(observation => {
    if(observation.length === 0) {
      return false;
    }
    return observation.every(obs => {
      return obs ? obs.entity === ComponentDeployment.ENTITY_NAME : false;
    });
  });

  data.Components.forEach(component => {
    if(component.Status === 'ACCEPTED') {
      let provider: ComponentDeployment.Provider = component.Provider;
      let resolvedProvider = providers?.find(p => p.Name === provider.Name);
      let errorMessage;

      if(component.Provider.Config) {
        let account = component.Provider.Config.find(config => config.Key === 'account');
        if(account) {
          let dependentAccountComponentObservations = dependentObservations[2] as Array<Component.EntityObservation>;
          try {
            provider.Account = lookupProviderAccountFromAccountComponents(account.Value, dependentAccountComponentObservations);
          } catch(err) {
            errorMessage = err;
          }
        }

        let credentials = component.Provider.Config.find(config => config.Key === 'credentials');
        if(credentials && account) {
          provider.Account = {
            accountId: account.Value,
            credentials: credentials.Value
          }
        }
      }

      if (resolvedProvider) {
        provider.Compute = resolvedProvider.Compute;
        provider.ResourceArn = resolvedProvider.ResourceArn;
      } else {
        if(['serverless-framework', 'cdk', 'hardcoded'].includes(provider.Name)) {
          provider.Compute = 'CODE_BUILD'
        } else {
          if(component.Provider.Config) {
            const compute = component.Provider.Config.find(config => config.Key === 'compute');
            if(compute) {
              switch(compute.Value) {
                case 'CODE_BUILD':
                case 'codebuild':
                case 'remote':
                  provider.Compute = 'CODE_BUILD';
                  break;
                default:
                  provider.Compute = 'CALLING_CLIENT';
              }
            }
          }
          provider.Compute = 'CALLING_CLIENT';
        }
      }

      const componentDeployment: ComponentDeployment.DataSchema = {
        DeploymentGuid: data.DeploymentGuid,
        Env: data.Env,
        Name: component.Name,
        Provider: component.Provider,
        Inputs: component.Inputs,
        Outputs: component.Outputs,
        Error: errorMessage,
        Method: data.Method
      }

      if(dependentComponentDeploymentObservations) {
        const dependentComponentDeployment = dependentComponentDeploymentObservations.find(observation => {
          return observation.data.Name === component.Name;
        })
        if(dependentComponentDeployment) {
          return;
        }
      }

      decisions.push(
        createNewObservation(
          ComponentDeployment.EntityObservation,
          componentDeployment,
          observation.traceid
        )
      );
    }
  });

  return decisions;
}
