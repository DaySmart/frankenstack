import { createNewObservation, generateTraceId, Observation2, } from "../Observation2";
import handler from './DeploymentUpdateDecider_DeploymentHandler';
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";
import { Deployment } from "../Entities/Deployment";

describe('DeploymentUpdateDecider_DeploymentHandler', () => {

	it('All deployed', () => {
    const deployment = createNewObservation(
        Deployment.EntityObservation,
        {
          DeploymentGuid: 'feg789',
          Env: 'test',
          Status: 'DEPLOY_IN_PROGRESS',
          User: 'jenkins',
          Components: [{
            Name: 'comp1',
            Provider: {Name: 'custom'},
            Status: 'DEPLOYED'
          }]
        },
        generateTraceId()
    );

		const resp: Observation2<DeploymentUpdate.EntityObservation>[] = handler(deployment, [[], []], { time: new Date() });

		expect(resp[0].entity).toEqual(DeploymentUpdate.ENTITY_NAME);
		expect(resp[0].data.DeploymentGuid).toEqual('feg789');
		expect(resp[0].data.Type).toEqual("DONE");
  });

	it('Deploy in-progress', () => {
    const deployment = createNewObservation(
        Deployment.EntityObservation,
        {
          DeploymentGuid: 'feg789',
          Env: 'test',
          Status: 'DEPLOY_IN_PROGRESS',
          User: 'jenkins',
          Components: [{
            Name: 'comp1',
            Provider: {Name: 'custom'},
            Status: 'DEPLOY_IN_PROGRESS'
          }]
        },
        generateTraceId()
    );

		const resp: Observation2<DeploymentUpdate.EntityObservation>[] = handler(deployment, [[],[]], { time: new Date() });

		expect(resp.length).toEqual(0);
  });

  	it('Deployment failed', () => {
    const deployment = createNewObservation(
        Deployment.EntityObservation,
        {
          DeploymentGuid: 'feg789',
          Env: 'test',
          Status: 'DEPLOY_IN_PROGRESS',
          User: 'jenkins',
          Components: [{
            Name: 'comp1',
            Provider: {Name: 'custom'},
            Status: 'DEPLOYMENT_FAILED',
            StatusReason: ["Something went wrong!"]
          }]
        },
        generateTraceId()
    );

		const resp: Observation2<DeploymentUpdate.EntityObservation>[] = handler(deployment, [[],[]], { time: new Date() });

		expect(resp[0].entity).toEqual(DeploymentUpdate.ENTITY_NAME);
		expect(resp[0].data.DeploymentGuid).toEqual('feg789');
		expect(resp[0].data.Type).toEqual("ERROR");
    expect(resp[0].data.Message).toContain('Something went wrong!');
  });

})
