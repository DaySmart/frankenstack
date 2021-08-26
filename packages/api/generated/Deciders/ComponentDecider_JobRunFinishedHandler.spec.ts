import handler from './ComponentDecider_JobRunFinishedHandler';
import { createNewObservation, generateTraceId, Observation2 } from 'o18k-ts-aws/';
import { JobRunFinished } from '../Entities/JobRunFinished';
import { Component } from '../Entities/Component';

describe('ComponentDecider JobRunFinishedHandler', () => {
	const deploymentGuid = 'abc123';
	const jobRunGuid = 'def456';
	const componentWithOutputs = createNewObservation<Component.EntityObservation>(Component.EntityObservation,
		{
			DeploymentGuid: 'feg789',
			Env: 'testEnv',
			Name: 'testName',
			Status: 'DEPLOYED',
			Create: new Date().toISOString(),
			Update: new Date().toISOString(),
			Outputs: [
				{
					Key: 'KeyOld',
					Value: 'ValueOld'
				}
			]
		}, generateTraceId()
	);

	it('Successful deployment', () => {
		const jobRunFinishedWithSuccess = createNewObservation<JobRunFinished.EntityObservation>(JobRunFinished.EntityObservation,
			{
				DeploymentGuid: deploymentGuid,
				JobRunGuid: jobRunGuid,
				Env: 'testEnv',
				Name: 'testName',
				Outputs: [
					{
						Key: 'Key1',
						Value: 'Value1'
					}
				],
				Status: 'Success'
			},
			generateTraceId()
		);
		const resp: Observation2<Component.EntityObservation>[] = handler(jobRunFinishedWithSuccess, [[]], { time: new Date() });

		expect(resp[0].entity).toEqual(Component.ENTITY_NAME);
		expect(resp[0].data.Outputs).toEqual([{ Key: 'Key1', Value: 'Value1'}])
		expect(resp[0].data.Status).toEqual('DEPLOYED');
	});

	it('Failed deployment with outputs', () => {
		const jobRunFinishedWithFailedWithOutputs = createNewObservation<JobRunFinished.EntityObservation>(JobRunFinished.EntityObservation,
			{
				DeploymentGuid: deploymentGuid,
				JobRunGuid: jobRunGuid,
				Env: 'testEnv',
				Name: 'testName',
				Outputs: [
					{
						Key: 'Key1',
						Value: 'Value1'
					}
				],
				Status: 'Failed'
			},
			generateTraceId()
		);
		const dependentObservations = [[componentWithOutputs]];
		const resp: Observation2<Component.EntityObservation>[] = handler(jobRunFinishedWithFailedWithOutputs, dependentObservations, { time: new Date() });

		expect(resp[0].entity).toEqual(Component.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
		expect(resp[0].data.Outputs).toEqual([{ Key: 'Key1', Value: 'Value1'}])
	});

	it('Failed deployment without outputs', () => {
		const jobRunFinishedWithFailedWithoutOutputs = createNewObservation<JobRunFinished.EntityObservation>(JobRunFinished.EntityObservation,
			{
				DeploymentGuid: deploymentGuid,
				JobRunGuid: jobRunGuid,
				Env: 'testEnv',
				Name: 'testName',
				Status: 'Failed'
			},
			generateTraceId()
		);
		const dependentObservations = [[componentWithOutputs]];
		const resp: Observation2<Component.EntityObservation>[] = handler(jobRunFinishedWithFailedWithoutOutputs, dependentObservations, { time: new Date() });

		expect(resp[0].entity).toEqual(Component.ENTITY_NAME);
		expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
		expect(resp[0].data.Outputs).toEqual([{ Key: 'KeyOld', Value: 'ValueOld'}])
	});
});