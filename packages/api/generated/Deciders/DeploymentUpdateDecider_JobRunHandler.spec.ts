import { createNewObservation, generateTraceId, Observation2, } from "../Observation2";
import handler from '../Deciders/DeploymentUpdateDecider_JobRunHandler';
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { JobRun } from "../Entities/JobRun";

describe('DeploymentUpdateDecider_JobRunHandler', () => {

	it('Component', () => {
    const jobRun = createNewObservation<JobRun.EntityObservation>(JobRun.EntityObservation,
      {
        JobRunGuid: 'abc123',
        DeploymentGuid: 'feg789',
        ComponentName: 'testComponentName',
        Type: 'CODEBUILD',
        CloudWatchLogGroup: 'group',
        CloudWatchLogStream: 'stream',
        Env: 'dev'
      }, generateTraceId()
    );

		const resp: Observation2<DeploymentUpdate.EntityObservation>[] = handler(jobRun, [[]], { time: new Date() });

		expect(resp[0].entity).toEqual(DeploymentUpdate.ENTITY_NAME);
		expect(resp[0].data.DeploymentGuid).toEqual('feg789');
		expect(resp[0].data.Type).toEqual("INFO");
  });

  it('Includes error messages', () => {
    const jobRun = createNewObservation<JobRun.EntityObservation>(JobRun.EntityObservation,
      {
        JobRunGuid: 'abc123',
        DeploymentGuid: 'feg789',
        ComponentName: 'testComponentName',
        Type: 'CODEBUILD',
        CloudWatchLogGroup: 'group',
        CloudWatchLogStream: 'stream',
        Error: 'Exception: It broke',
        Env: 'dev'
      }, generateTraceId()
    );

    const resp: Observation2<DeploymentUpdate.EntityObservation>[] = handler(jobRun, [[]], { time: new Date() });

    expect(resp[0].entity).toEqual(DeploymentUpdate.ENTITY_NAME);
    expect(resp[0].data.DeploymentGuid).toEqual('feg789');
    expect(resp[0].data.Type).toEqual("INFO");
    expect(resp[0].data.Message).toEqual('Deployment of testComponentName FAILED!\nException: It broke');
  });
})
