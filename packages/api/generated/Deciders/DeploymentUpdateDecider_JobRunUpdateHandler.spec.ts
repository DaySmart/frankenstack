import { createNewObservation, generateTraceId, Observation2, } from "../Observation2";
import handler from './DeploymentUpdateDecider_JobRunUpdateHandler';
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { JobRunUpdate } from "../Entities/JobRunUpdate";
import { JobRun } from "../Entities/JobRun";

describe('DeploymentUpdateDecider_JobRunUpdateHandler', () => {

	it('Component', () => {
    const jobRunUpdate = createNewObservation<JobRunUpdate.EntityObservation>(JobRunUpdate.EntityObservation,
      {
        JobRunGuid: 'abc123',
        CloudWatchGroupName: 'group',
        CloudWatchLogStream: 'stream',
        Message: 'message'
      }, generateTraceId()
    );

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
    const dependentObservations = [[jobRun]];

		const resp: Observation2<DeploymentUpdate.EntityObservation>[] = handler(jobRunUpdate, dependentObservations, { time: new Date() });

		expect(resp[0].entity).toEqual(DeploymentUpdate.ENTITY_NAME);
		expect(resp[0].data.DeploymentGuid).toEqual('feg789');
		expect(resp[0].data.Message).toEqual('message');
		expect(resp[0].data.Type).toEqual("INFO");
  });
})
