import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { Component } from '../Entities/Component';
import { ComponentDeployment } from '../Entities/ComponentDeployment';
import { Deployment } from '../Entities/Deployment';
import { Provider } from '../Entities/Provider';
import handler from './ComponentDeploymentDecider_DeploymentHandler';

describe('ComponentDeploymentDecider DeploymentHandler', () => {
    
    it('ACCEPTED component with custom provider', () => {
        const customProvider: Provider.DataSchema = {
            Name: 'custom',
            Compute: 'LAMBDA',
            ResourceArn: 'arn:0123:us-east-1:lambda:function:custom123',
            Version: '0.1'
        }

        const customeProviderObservation = createNewObservation(
            Provider.EntityObservation,
            customProvider,
            generateTraceId()
        );

        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'custom'},
                Status: 'ACCEPTED'
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [], // ComponentDeployments
                [customeProviderObservation]
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(ComponentDeployment.ENTITY_NAME);
        expect(resp[0].data.Provider).toEqual(
            expect.objectContaining({
                Name: 'custom',
                Compute: 'LAMBDA',
                ResourceArn: 'arn:0123:us-east-1:lambda:function:custom123'
            })
        );
    });

    it('ACCEPTED deployment with no existing ComponentDeployments', () => {
        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'custom'},
                Status: 'ACCEPTED',
                Inputs: [{Key: 'foo', Value: 'bar'}]
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [], // ComponentDeployments
                [], // Providers
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(ComponentDeployment.ENTITY_NAME);

        const expectedComponentDeploymentData: ComponentDeployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Name: 'comp1',
            Provider: {Name: 'custom', Config: []},
            Inputs: [{Key: 'foo', Value: 'bar'}]
        }
        expect(resp[0].data).toEqual(
            expect.objectContaining(expectedComponentDeploymentData)
        );
    });

    test.each`
    deploymentStatus
    ${'DEPLOY_IN_PROGRESS'}
    ${'DEPLOYED'}
    ${'DEPLOYMENT_FAILED'}
    ${'UNAUTHORIZED'}
    ${'WAITING_ON_DEPENDENT_DEPLOYMENT'}
    `("Component status of $deploymentStatus doesn't trigger ComponentDeployment", ({deploymentStatus}) => {
        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'custom'},
                Status: deploymentStatus,
                Inputs: [{Key: 'foo', Value: 'bar'}]
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [], // ComponentDeployments
                [], // Providers
            ],
            {time: new Date()}
        );

        expect(resp.length).toEqual(0);
    });

    it('ACCEPTED component deployment with existing ComponentDeployment', () => {
        const dependentComponentDeployment: ComponentDeployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Name: 'comp1',
            Provider: {Name: 'hardcoded'},
            Inputs: [{Key: 'foo', Value: 'bar'}]
        }

        const dependentComponentDeploymentObservation = createNewObservation(
            ComponentDeployment.EntityObservation,
            dependentComponentDeployment,
            generateTraceId()
        );

        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'hardcoded'},
                Status: 'ACCEPTED',
                Inputs: [{Key: 'foo', Value: 'bar'}]
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [dependentComponentDeploymentObservation], // ComponentDeployments
                [], // Providers
            ],
            {time: new Date()}
        );

        expect(resp.length).toEqual(0);
    });

    it('Account credentials are included', () => {
        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'custom',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]
                },
                Status: 'ACCEPTED',
                Inputs: [{Key: 'foo', Value: 'bar'}]
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const accountComponent: Component.DataSchema = {
            Name: 'aws',
            Env: 'sandbox',
            DeploymentGuid: "blahhh",
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Outputs: [
                {
                    Key: 'accountId',
                    Value: 'foo'
                },
                {
                    Key: 'credentials',
                    Value: 'ssm:/sandbox/foo/credentials'
                }
            ]
        };

        const accountComponentObservation = createNewObservation(
            Component.EntityObservation,
            accountComponent,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [], // ComponentDeployments
                [], // Providers
                [accountComponentObservation], // Accounts
            ],
            {time: new Date()}
        );

        expect(resp[0].data.Provider.Account).toEqual({
            accountId: 'foo',
            credentials: 'ssm:/sandbox/foo/credentials'
        });
    });

    it('Error thrown when account dependent component is missing', () => {
        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'custom',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]
                },
                Status: 'ACCEPTED',
                Inputs: [{Key: 'foo', Value: 'bar'}]
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const accountComponent: Component.DataSchema = {
            Name: 'aws',
            Env: 'prod',
            DeploymentGuid: "blahhh",
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Outputs: [
                {
                    Key: 'accountId',
                    Value: 'foo'
                },
                {
                    Key: 'credentials',
                    Value: 'ssm:/sandbox/foo/credentials'
                }
            ]
        };

        const accountComponentObservation = createNewObservation(
            Component.EntityObservation,
            accountComponent,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [], // ComponentDeployments
                [], // Providers
                [accountComponentObservation], // Accounts
            ],
            {time: new Date()}
        );

        console.log(resp[0].data.Error);

        expect(resp[0].data.Error).toEqual('Failed to find account named sandbox:aws');
    });

    it('Error thrown when account dependent component is missing accountId', () => {
        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'custom',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]
                },
                Status: 'ACCEPTED',
                Inputs: [{Key: 'foo', Value: 'bar'}]
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const accountComponent: Component.DataSchema = {
            Name: 'aws',
            Env: 'sandbox',
            DeploymentGuid: "blahhh",
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Outputs: [
                {
                    Key: 'credentials',
                    Value: 'ssm:/sandbox/foo/credentials'
                }
            ]
        };

        const accountComponentObservation = createNewObservation(
            Component.EntityObservation,
            accountComponent,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [], // ComponentDeployments
                [], // Providers
                [accountComponentObservation], // Accounts
            ],
            {time: new Date()}
        );

        console.log(resp[0].data.Error);

        expect(resp[0].data.Error).toEqual('Account sandbox:aws is missing accountId');
    });

    it('Error thrown when account dependent component is missing credentials', () => {
        const deployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'test',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'custom',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]
                },
                Status: 'ACCEPTED',
                Inputs: [{Key: 'foo', Value: 'bar'}]
            }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const accountComponent: Component.DataSchema = {
            Name: 'aws',
            Env: 'sandbox',
            DeploymentGuid: "blahhh",
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Outputs: [
                {
                    Key: 'accountId',
                    Value: 'hello'
                }
            ]
        };

        const accountComponentObservation = createNewObservation(
            Component.EntityObservation,
            accountComponent,
            generateTraceId()
        );

        const resp = handler(
            deploymentObservation,
            [
                [], // ComponentDeployments
                [], // Providers
                [accountComponentObservation], // Accounts
            ],
            {time: new Date()}
        );

        console.log(resp[0].data.Error);

        expect(resp[0].data.Error).toEqual('Account sandbox:aws is missing credentials');
    });
});