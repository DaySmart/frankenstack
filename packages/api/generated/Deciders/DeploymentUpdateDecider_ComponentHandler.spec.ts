import { Component } from "../Entities/Component";
import { createNewObservation, generateTraceId, Observation2, } from "../Observation2";
import handler from '../Deciders/DeploymentUpdateDecider_ComponentHandler';
import { DeploymentUpdate } from "../Entities/DeploymentUpdate";

describe('DeploymentUpdateDecider_ComponentHandler', () => {

	it('Component', () => {
    const component = createNewObservation<Component.EntityObservation>(Component.EntityObservation,
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

		const resp: Observation2<DeploymentUpdate.EntityObservation>[] = handler(component, [[]], { time: new Date() });

		expect(resp[0].entity).toEqual(DeploymentUpdate.ENTITY_NAME);
		expect(resp[0].data.DeploymentGuid).toEqual('feg789');
		expect(resp[0].data.Type).toEqual("COMPONENT_DONE");
  });
})
