import { Context } from 'o18k-ts-aws';
import { lookupProviderAccountFromAccountComponents } from '../../src/utils/providerLookups';
import { Component } from '../Entities/Component';
import { ComponentDeployment } from '../Entities/ComponentDeployment';
import { Deployment } from '../Entities/Deployment';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { Provider } from '../Entities/Provider';
import { createNewObservation, Observation2 } from '../Observation2';

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
		return observations.every(obs => obs ? obs.entity === Provider.ENTITY_NAME : false);
	});

	const providers = dependentProviderObservations?.map(obs => obs.data);

	const dependentComponentDeploymentObservations: Observation2<ComponentDeployment.EntityObservation>[] | undefined = dependentObservations.find(observation => {
		if(observation.length === 0) {
			return false;
		}
		return observation.every(obs => obs ? obs.entity === ComponentDeployment.ENTITY_NAME : false);
	});

	data.Components.forEach(component => {
		if(component.Status === 'ACCEPTED') {
			const provider: ComponentDeployment.Provider = component.Provider;
			const resolvedProvider = providers?.find(p => p.Name === provider.Name);
			let errorMessage;

			if(component.Provider.Config) {
				const account = component.Provider.Config.find(config => config.Key === 'account');
				if(account) {
					const dependentAccountComponentObservations = dependentObservations[2] as Array<Component.EntityObservation>;
					try {
						provider.Account = lookupProviderAccountFromAccountComponents(account.Value, dependentAccountComponentObservations);
					} catch(err) {
						errorMessage = err;
					}
				}
			}

			if (resolvedProvider) {
				provider.Compute = resolvedProvider.Compute;
				provider.ResourceArn = resolvedProvider.ResourceArn;
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
			};

			if(dependentComponentDeploymentObservations) {
				const dependentComponentDeployment = dependentComponentDeploymentObservations.find(observation => observation.data.Name === component.Name);
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
