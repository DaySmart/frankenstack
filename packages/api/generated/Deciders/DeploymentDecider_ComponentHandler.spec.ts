import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { Component } from '../Entities/Component';
import { Deployment } from '../Entities/Deployment';
import handler from './DeploymentDecider_ComponentHandler';

describe('DeploymentDecider ComponentHandler', () => {

	it('Last Component deployed succesfully', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeployment: Deployment.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Status: 'DEPLOY_IN_PROGRESS',
			User: 'jenkins',
			Start: new Date().toISOString(),
			Components: [{
				Name: 'comp1',
				Provider: {Name: 'hardcoded'},
				Status: 'ACCEPTED'
			}]
		};

		const dependentDeploymentObservation = createNewObservation(
			Deployment.EntityObservation,
			dependentDeployment,
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Name: 'comp1',
			Status: 'DEPLOYED',
			Create: new Date().toISOString(),
			Update: new Date().toISOString()
		};

		const componentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const resp = handler(
			componentObservation,
			[[dependentDeploymentObservation]],
			{time: new Date()}
		);

		expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOYED');
		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp1',
					Status: 'DEPLOYED'
				})
			])
		);
		expect(resp[0].data.Finish).toBeTruthy();
	});

	it('Last component deployed with failure', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeployment: Deployment.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Status: 'DEPLOY_IN_PROGRESS',
			User: 'jenkins',
			Start: new Date().toISOString(),
			Components: [{
				Name: 'comp1',
				Provider: {Name: 'hardcoded'},
				Status: 'ACCEPTED'
			}]
		};

		const dependentDeploymentObservation = createNewObservation(
			Deployment.EntityObservation,
			dependentDeployment,
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Name: 'comp1',
			Status: 'DEPLOYMENT_FAILED',
			Create: new Date().toISOString(),
			Update: new Date().toISOString()
		};

		const componentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const resp = handler(
			componentObservation,
			[[dependentDeploymentObservation]],
			{time: new Date()}
		);

		expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp1',
					Status: 'DEPLOYMENT_FAILED'
				})
			])
		);
		expect(resp[0].data.Finish).toBeTruthy();
	});

	it('Component resolves lookup for dependent component', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeployment: Deployment.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Status: 'DEPLOY_IN_PROGRESS',
			User: 'jenkins',
			Start: new Date().toISOString(),
			Components: [
				{
					Name: 'comp1',
					Provider: {Name: 'hardcoded'},
					Status: 'ACCEPTED',
					Inputs: [{Key: 'MY_INPUT', Value: 'SECRET'}]
				},
				{
					Name: 'comp2',
					Provider: {Name: 'hardcoded'},
					Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
					Inputs: [{Key: 'LOOKUP', Value: '${myenv:comp1:MY_INPUT}'}]
				}
			]
		};

		const dependentDeploymentObservation = createNewObservation(
			Deployment.EntityObservation,
			dependentDeployment,
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Name: 'comp1',
			Status: 'DEPLOYED',
			Outputs: [{
				Key: 'MY_INPUT',
				Value: 'SECRET'
			}],
			Create: new Date().toISOString(),
			Update: new Date().toISOString()
		};

		const componentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const resp = handler(
			componentObservation,
			[[dependentDeploymentObservation]],
			{time: new Date()}
		);

		expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp1',
					Status: 'DEPLOYED'
				})
			])
		);

		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp2',
					Status: 'ACCEPTED',
					Inputs: [{Key: 'LOOKUP', Value: 'SECRET'}]
				})
			])
		);
	});

	it('Dependent component in template is missing required output', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeployment: Deployment.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Status: 'DEPLOY_IN_PROGRESS',
			User: 'jenkins',
			Start: new Date().toISOString(),
			Components: [
				{
					Name: 'comp1',
					Provider: {Name: 'hardcoded'},
					Status: 'ACCEPTED',
					Inputs: [{Key: 'MY_INPUT', Value: 'SECRET'}]
				},
				{
					Name: 'comp2',
					Provider: {Name: 'hardcoded'},
					Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
					Inputs: [{Key: 'LOOKUP', Value: '${myenv:comp1:THE_INPUT}'}]
				}
			]
		};

		const dependentDeploymentObservation = createNewObservation(
			Deployment.EntityObservation,
			dependentDeployment,
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Name: 'comp1',
			Status: 'DEPLOYED',
			Outputs: [{
				Key: 'MY_INPUT',
				Value: 'SECRET'
			}],
			Create: new Date().toISOString(),
			Update: new Date().toISOString()
		};

		const componentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const resp = handler(
			componentObservation,
			[[dependentDeploymentObservation]],
			{time: new Date()}
		);

		expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp1',
					Status: 'DEPLOYED'
				})
			])
		);

		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp2',
					Status: 'DEPLOYMENT_FAILED',
					Inputs: [{Key: 'LOOKUP', Value: '${myenv:comp1:THE_INPUT}'}],
					StatusReason: [
						'Dependent component comp1 was missing output value for THE_INPUT'
					]
				})
			])
		);
	});

	it('Dependent component not resolved by component', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeployment: Deployment.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Status: 'DEPLOY_IN_PROGRESS',
			User: 'jenkins',
			Start: new Date().toISOString(),
			Components: [
				{
					Name: 'comp1',
					Provider: {Name: 'hardcoded'},
					Status: 'ACCEPTED',
					Inputs: [{Key: 'MY_INPUT', Value: 'SECRET'}]
				},
				{
					Name: 'comp2',
					Provider: {Name: 'hardcoded'},
					Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
					Inputs: [{Key: 'LOOKUP', Value: '${myenv:comp1:MY_INPUT}'}]
				},
				{
					Name: 'comp3',
					Provider: {Name: 'hardcoded'},
					Status: 'ACCEPTED',
					Inputs: [{Key: 'MY_INPUT', Value: 'SOMETHING'}]
				}
			]
		};

		const dependentDeploymentObservation = createNewObservation(
			Deployment.EntityObservation,
			dependentDeployment,
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Name: 'comp3',
			Status: 'DEPLOYED',
			Outputs: [{
				Key: 'MY_INPUT',
				Value: 'SOMETHING'
			}],
			Create: new Date().toISOString(),
			Update: new Date().toISOString()
		};

		const componentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const resp = handler(
			componentObservation,
			[[dependentDeploymentObservation]],
			{time: new Date()}
		);

		expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp3',
					Status: 'DEPLOYED'
				})
			])
		);

		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp2',
					Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
					Inputs: [{Key: 'LOOKUP', Value: '${myenv:comp1:MY_INPUT}'}]
				})
			])
		);
	});

	it('Component not removed when a dependent component is in progress', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeployment: Deployment.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Status: 'DEPLOY_IN_PROGRESS',
			User: 'jenkins',
			Start: new Date().toISOString(),
			Method: 'remove',
			Components: [
				{
					Name: 'comp1',
					Provider: {Name: 'hardcoded'},
					Status: 'ACCEPTED',
					Inputs: [{Key: 'MY_INPUT', Value: '${myenv:comp3:output}'}],
					DependsOn: []
				},
				{
					Name: 'comp2',
					Provider: {Name: 'hardcoded'},
					Status: 'ACCEPTED',
					Inputs: [{Key: 'LOOKUP', Value: '${myenv:comp1:MY_INPUT}'}],
					DependsOn: []
				},
				{
					Name: 'comp3',
					Provider: {Name: 'hardcoded'},
					Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
					Inputs: [{Key: 'MY_INPUT', Value: 'SOMETHING'}],
					DependsOn: ['comp1', 'comp2']
				}
			]
		};

		const dependentDeploymentObservation = createNewObservation(
			Deployment.EntityObservation,
			dependentDeployment,
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Name: 'comp2',
			Status: 'DELETED',
			Outputs: [{
				Key: 'MY_INPUT',
				Value: 'SOMETHING'
			}],
			Create: new Date().toISOString(),
			Update: new Date().toISOString()
		};

		const componentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const resp = handler(
			componentObservation,
			[[dependentDeploymentObservation]],
			{time: new Date()}
		);

		console.log(JSON.stringify(resp, null, 2));

		expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp2',
					Status: 'DELETED'
				})
			])
		);

		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp3',
					Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
				})
			])
		);
	});

	it('Component removed when a dependent component is deleted', () => {
		const deploymentGuid = 'abcdefg';

		const dependentDeployment: Deployment.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Status: 'DEPLOY_IN_PROGRESS',
			User: 'jenkins',
			Start: new Date().toISOString(),
			Method: 'remove',
			Components: [
				{
					Name: 'comp1',
					Provider: {Name: 'hardcoded'},
					Status: 'ACCEPTED',
					Inputs: [{Key: 'MY_INPUT', Value: '${myenv:comp3:output}'}]
				},
				{
					Name: 'comp2',
					Provider: {Name: 'hardcoded'},
					Status: 'DELETED',
					Inputs: [{Key: 'LOOKUP', Value: '${myenv:comp1:MY_INPUT}'}]
				},
				{
					Name: 'comp3',
					Provider: {Name: 'hardcoded'},
					Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
					Inputs: [{Key: 'MY_INPUT', Value: 'SOMETHING'}],
					DependsOn: ['comp1']
				}
			]
		};

		const dependentDeploymentObservation = createNewObservation(
			Deployment.EntityObservation,
			dependentDeployment,
			generateTraceId()
		);

		const component: Component.DataSchema = {
			DeploymentGuid: deploymentGuid,
			Env: 'myenv',
			Name: 'comp1',
			Status: 'DELETED',
			Outputs: [{
				Key: 'MY_INPUT',
				Value: 'SOMETHING'
			}],
			Create: new Date().toISOString(),
			Update: new Date().toISOString()
		};

		const componentObservation = createNewObservation(
			Component.EntityObservation,
			component,
			generateTraceId()
		);

		const resp = handler(
			componentObservation,
			[[dependentDeploymentObservation]],
			{time: new Date()}
		);

		console.log(JSON.stringify(resp, null, 2));

		expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
		expect(resp[0].data.Method).toEqual('remove');
		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp1',
					Status: 'DELETED'
				})
			])
		);

		expect(resp[0].data.Components).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Name: 'comp3',
					Status: 'ACCEPTED',
				})
			])
		);
	});
});