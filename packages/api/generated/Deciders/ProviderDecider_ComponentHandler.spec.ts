import { createNewObservation, generateTraceId, Observation2, } from "../Observation2";
import handler from './ProviderDecider_ComponentHandler';
import { Provider } from "../Entities/Provider";
import { Component } from "../Entities/Component";
import { ComponentDeployment } from "../Entities/ComponentDeployment";

describe('ProviderDecider_ComponentHandler', () => {

	it('Creating provider', () => {
    const component = createNewObservation(
      Component.EntityObservation,
      {
        DeploymentGuid: 'abc123',
        Env: 'provider',
        Name: 'comp1',
        Status: 'DEPLOYED',
        Outputs: [{
          Key: 'ResourceArn',
          Value: 'TestArn'
        },
        ],
        Create: new Date().toISOString(),
        Update: new Date().toISOString()
      },
      generateTraceId()
    );


    const componentDeployment = createNewObservation<ComponentDeployment.EntityObservation>(ComponentDeployment.EntityObservation,
      {
        DeploymentGuid: 'abc123',
        Env: 'provider',
        Name: 'comp1',
        Provider: {
          Name: 'test'
        },
        Inputs: [{
          Key: 'compute',
          Value: 'LAMBDA'
        },
        {
          Key: 'version',
          Value: '1.0'
        }],
      },
      generateTraceId()
    );
    const dependentObservations = [[componentDeployment]];

		const resp: Observation2<Provider.EntityObservation>[] = handler(component, dependentObservations, { time: new Date() });

		expect(resp[0].entity).toEqual(Provider.ENTITY_NAME);
		expect(resp[0].data.Compute).toEqual('LAMBDA');
		expect(resp[0].data.Version).toEqual('1.0');
		expect(resp[0].data.ResourceArn).toEqual("TestArn");
  });

  it('Non-provider environment', () => {
    const component = createNewObservation(
      Component.EntityObservation,
      {
        DeploymentGuid: 'abc123',
        Env: 'notprovider',
        Name: 'comp1',
        Status: 'DEPLOYED',
        Outputs: [{
          Key: 'ResourceArn',
          Value: 'TestArn'
        },
        ],
        Create: new Date().toISOString(),
        Update: new Date().toISOString()
      },
      generateTraceId()
    );


    const componentDeployment = createNewObservation<ComponentDeployment.EntityObservation>(ComponentDeployment.EntityObservation,
      {
        DeploymentGuid: 'abc123',
        Env: 'provider',
        Name: 'comp1',
        Provider: {
          Name: 'test'
        },
        Inputs: [{
          Key: 'compute',
          Value: 'LAMBDA'
        },
        {
          Key: 'version',
          Value: '1.0'
        }],
      },
      generateTraceId()
    );
    const dependentObservations = [[componentDeployment]];

		const resp: Observation2<Provider.EntityObservation>[] = handler(component, dependentObservations, { time: new Date() });

		expect(resp.length).toEqual(0);
  });

    it('Missing ResourceArn', () => {
    const component = createNewObservation(
      Component.EntityObservation,
      {
        DeploymentGuid: 'abc123',
        Env: 'provider',
        Name: 'comp1',
        Status: 'DEPLOYED',
        Create: new Date().toISOString(),
        Update: new Date().toISOString()
      },
      generateTraceId()
    );


    const componentDeployment = createNewObservation<ComponentDeployment.EntityObservation>(ComponentDeployment.EntityObservation,
      {
        DeploymentGuid: 'abc123',
        Env: 'provider',
        Name: 'comp1',
        Provider: {
          Name: 'test'
        },
        Inputs: [{
          Key: 'compute',
          Value: 'LAMBDA'
        },
        {
          Key: 'version',
          Value: '1.0'
        }],
      },
      generateTraceId()
    );
    const dependentObservations = [[componentDeployment]];

		const resp: Observation2<Provider.EntityObservation>[] = handler(component, dependentObservations, { time: new Date() });

		expect(resp.length).toEqual(0);
  });
})
