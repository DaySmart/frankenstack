import handler from './DeploymentRequestDecider_DeploymentFormHandler';
import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { DeploymentForm } from '../Entities/DeploymentForm';
import { DeploymentRequest } from '../Entities/DeploymentRequest';
import { User } from '../Entities/User';

describe('DeploymentRequestDecider DeploymentFormHandler', () => {

	const user: User.DataSchema = {
		UserId: 'jenkins',
		PolicyNames: ['foo']
	};

	const userObservation = createNewObservation(
		User.EntityObservation,
		user,
		generateTraceId()
	);

	it('Happy path', () => {
		const deploymentForm: DeploymentForm.DataSchema = {
			DeploymentGuid: 'abcdefg',
			Env: 'test',
			User: 'jenkins',
			Components: [{
				Name: 'comp1',
				Provider: {
					Name: 'hardcoded',
				},
				Inputs: [
					{
						Key: 'foo',
						Value: 'bar'
					}
				]

			}]
		};
		const deploymentFormObservation = createNewObservation(
			DeploymentForm.EntityObservation,
			deploymentForm,
			generateTraceId()
		);

		const resp = handler(
			deploymentFormObservation,
			[
				[], // DeploymentRequest
				[userObservation]
			],
			{
				time: new Date()
			}
		);

		expect(resp[0].entity).toEqual(DeploymentRequest.ENTITY_NAME);
		expect(resp[0].data.PolicyNames).toEqual(['foo']);
	});

	it('User does not exist', () => {
		const deploymentForm: DeploymentForm.DataSchema = {
			DeploymentGuid: 'abcdefg',
			Env: 'test',
			User: 'jenkins',
			Components: [{
				Name: 'comp1',
				Provider: {
					Name: 'hardcoded',
				},
				Inputs: [
					{
						Key: 'foo',
						Value: 'bar'
					}
				]

			}]
		};
		const deploymentFormObservation = createNewObservation(
			DeploymentForm.EntityObservation,
			deploymentForm,
			generateTraceId()
		);

		const resp = handler(
			deploymentFormObservation,
			[
				[], // DeploymentRequest
				[] // User
			],
			{
				time: new Date()
			}
		);

		expect(resp[0].entity).toEqual(DeploymentRequest.ENTITY_NAME);
		expect(resp[0].data.PolicyNames).toEqual([]);
	});

	it('Duplicate DeploymentRequests not created', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeploymentRequest: DeploymentRequest.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'test',
			User: 'jenkins',
			PolicyNames: ['foo'],
			Components: [{
				Name: 'comp1',
				Provider: {Name: 'hardcoded'},
				Inputs: [{Key: 'foo', Value: 'bar'}]
			}]
		};

		const dependentDeploymentRequestObservation = createNewObservation(
			DeploymentRequest.EntityObservation,
			dependentDeploymentRequest,
			generateTraceId()
		);

		const deploymentForm: DeploymentForm.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'test',
			User: 'jenkins',
			Components: [{
				Name: 'comp1',
				Provider: {
					Name: 'hardcoded',
				},
				Inputs: [
					{
						Key: 'foo',
						Value: 'bar'
					}
				]

			}]
		};
		const deploymentFormObservation = createNewObservation(
			DeploymentForm.EntityObservation,
			deploymentForm,
			generateTraceId()
		);

		const resp = handler(
			deploymentFormObservation,
			[
				[dependentDeploymentRequestObservation],
				[userObservation]
			],
			{
				time: new Date()
			}
		);

		expect(resp.length).toEqual(0);
	});
});