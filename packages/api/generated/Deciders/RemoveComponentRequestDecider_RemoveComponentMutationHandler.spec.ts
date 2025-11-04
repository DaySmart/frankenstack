import { createNewObservation, generateTraceId, Observation2, } from '../Observation2';
import handler from './RemoveComponentRequestDecider_RemoveComponentMutationHandler';
import { Component } from '../Entities/Component';
import { RemoveComponentMutation } from '../Entities/RemoveComponentMutation';
import { User } from '../Entities/User';
import { RemoveComponentRequest } from '../Entities/RemoveComponentRequest';

describe('RemoveComponentRequestDecider_RemoveComponentMutationHandler', () => {

	it('Component', () => {
		const removeComponentMutation = createNewObservation<RemoveComponentMutation.EntityObservation>(RemoveComponentMutation.EntityObservation,
			{
				DeploymentGuid: 'abc123',
				Env: 'provider',
				ComponentName: 'removeMutation',
				User: 'frank',
			},
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: 'defghi',
			Create: new Date().toISOString(),
			Env: 'provider',
			Name: 'removeMutation',
			Status: 'DEPLOYED',
			Update: new Date().toISOString()
		};

		const dependentComponentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const user: User.DataSchema = {
			PolicyNames: ['policy'],
			UserId: 'frank'
		};

		const userObservations = createNewObservation(
			User.EntityObservation,
			user,
			generateTraceId()
		);

		const dependentObservations = [[dependentComponentObservation],[userObservations]];

		const resp: Observation2<RemoveComponentRequest.EntityObservation>[] = handler(removeComponentMutation, dependentObservations, { time: new Date() });

		expect(resp[0].entity).toEqual(RemoveComponentRequest.ENTITY_NAME);
		expect(resp[0].data.ComponentDeployments.length).toEqual(1);
		expect(resp[0].data.ComponentDeployments[0].ComponentName).toEqual('removeMutation');
		expect(resp[0].data.ComponentDeployments[0].LastDeploymentGuid).toEqual('defghi');
		expect(resp[0].data.PolicyNames).toEqual(['policy']);
		expect(resp[0].data.User).toEqual('frank');
	});
});