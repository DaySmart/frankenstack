import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { Component } from '../Entities/Component';
import { ComponentDeployment } from '../Entities/ComponentDeployment';
import { Deployment } from '../Entities/Deployment';
import { Policy } from '../Entities/Policy';
import { DeploymentRequest } from '../Entities/DeploymentRequest';
import handler from './DeploymentDecider_DeploymentRequestHandler';

describe('DeploymentDecider DeploymentRequestHandler', () => {

    const openPolicy: Policy.DataSchema = {
        PolicyName: 'test',
        Statements: [
            {
                Effect: 'Allow',
                Resources: ['*'],
                Actions: ['*']
            }
        ]
    }

    const openPolicyObservation = createNewObservation(
        Policy.EntityObservation,
        openPolicy,
        generateTraceId()
    );

    it('Happy Path Deployment', () => {

        const deployment: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: 'abcdefg',
            User: 'jenkins',
            PolicyNames: ['test'],
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'hardcoded'
                },
                Inputs: [
                    {Key: 'foo', Value: 'bar'}
                ]
            }]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [], // ComponentDeployments,
                [], // Components
                [openPolicyObservation]
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components[0].Status).toEqual('ACCEPTED');
    });

    it('Happy Path without dependent observations', () => {
        const deployment: DeploymentRequest.DataSchema = {
            Env: 'foo',
            DeploymentGuid: '38fedc2f-2413-4d68-a1e5-f9a7edbe3cb9',
            User: 'ethan.evans',
            PolicyNames: [],
            Components: [{"Name":"bar2","Provider":{"Name":"hardcoded"},"Inputs":[{"Key":"asdfasdf","Value":"hello"},{"Key":"ANOTHEsdfR","Value":"hi"}]},{"Name":"bar3","Provider":{"Name":"hardcoded"},"Inputs":[{"Key":"asdfasdf","Value":"hello"},{"Key":"test","Value":"${foo:bar2:asdfasdf}"}]}]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [], // ComponentDeployments,
                [], // Components
                []
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components[0].Status).toEqual('ACCEPTED');
    });

    it('Dependent ComponentDeployment marks Component status DEPLOY_IN_PROGRESS', () => {
        const deploymentGuid = 'abcdefg'
        const dependentComponentDeployment: ComponentDeployment.DataSchema = {
            DeploymentGuid: deploymentGuid,
            Env: 'myenv',
            Name: 'comp1',
            Provider: {
                Name: 'hardcoded'
            },
            Inputs: [{Key: 'foo', Value: 'bar'}]
        }

        const dependentComponentDeploymentObservation = createNewObservation(
            ComponentDeployment.EntityObservation,
            dependentComponentDeployment,
            generateTraceId()
        );

        const deployment: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: deploymentGuid,
            User: 'jenkins',
            PolicyNames: ['test'],
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'hardcoded'
                },
                Inputs: [
                    {Key: 'foo', Value: 'bar'}
                ]
            }]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [dependentComponentDeploymentObservation], // ComponentDeployments
                [], // Components
                [openPolicyObservation]
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components[0].Status).toEqual('DEPLOY_IN_PROGRESS');
    });

    it('External input lookup replaces input value', () => {
        const dependentComponent: Component.DataSchema = {
            DeploymentGuid: 'xyzabc',
            Env: 'myenv',
            Name: 'externalcomp',
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Status: 'DEPLOYED',
            Outputs: [{
                Key: 'MY_VAR',
                Value: 'MY_VALUE'
            }]
        }

        const dependentComponentObservation = createNewObservation(
            Component.EntityObservation,
            dependentComponent,
            generateTraceId()
        );

        const deployment: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: 'abcdefg',
            User: 'jenkins',
            PolicyNames: ['test'],
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'hardcoded'
                },
                Inputs: [
                    {Key: 'foo', Value: '${myenv:externalcomp:MY_VAR}'}
                ]
            }]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [], // ComponentDeployments
                [dependentComponentObservation],
                [openPolicyObservation]
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components[0].Status).toEqual('ACCEPTED');
        expect(resp[0].data.Components[0].Inputs).toEqual(expect.arrayContaining([{Key: 'foo', Value: 'MY_VALUE'}]));
    });

    it('Deployment fails when external lookup fails (Component found but missing output)', () => {

        const dependentComponent: Component.DataSchema = {
            DeploymentGuid: 'xyzabc',
            Env: 'myenv',
            Name: 'externalcomp',
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Status: 'DEPLOYED',
            Outputs: [{
                Key: 'MY_VAR',
                Value: 'MY_VALUE'
            }]
        }

        const dependentComponentObservation = createNewObservation(
            Component.EntityObservation,
            dependentComponent,
            generateTraceId()
        );

        const deployment: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: 'abcdefg',
            User: 'jenkins',
            PolicyNames: ['test'],
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'hardcoded'
                },
                Inputs: [
                    {Key: 'foo', Value: '${myenv:externalcomp:THE_VAR}'}
                ]
            }]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [], // ComponentDeployments,
                [dependentComponentObservation], // Components
                [openPolicyObservation]
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
        expect(resp[0].data.Components[0].Status).toEqual('DEPLOYMENT_FAILED');
        expect(resp[0].data.Components[0].StatusReason).toEqual([
            'Failed to find output (THE_VAR) for component myenv:externalcomp'
        ])
    });

    it('Deployment fails when external lookup fails (Component missing)', () => {

        const dependentComponent: Component.DataSchema = {
            DeploymentGuid: 'xyzabc',
            Env: 'myenv',
            Name: 'externalcomp',
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Status: 'DEPLOYED',
            Outputs: [{
                Key: 'MY_VAR',
                Value: 'MY_VALUE'
            }]
        }

        const dependentComponentObservation = createNewObservation(
            Component.EntityObservation,
            dependentComponent,
            generateTraceId()
        );

        const deployment: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: 'abcdefg',
            User: 'jenkins',
            PolicyNames: ['test'],
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'hardcoded'
                },
                Inputs: [
                    {Key: 'foo', Value: '${myenv:missingcomp:THE_VAR}'}
                ]
            }]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [], // ComponentDeployments,
                [dependentComponentObservation], // Components
                [openPolicyObservation]
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
        expect(resp[0].data.Components[0].Status).toEqual('DEPLOYMENT_FAILED');
        expect(resp[0].data.Components[0].StatusReason).toEqual([
            'Failed to find component myenv:missingcomp'
        ])
    });

    it('Component dependent on component in template has status WAITING_ON_DEPENDENT_DEPLOYMENT', () => {
        const dependentComponent: Component.DataSchema = {
            DeploymentGuid: 'xyzabc',
            Env: 'myenv',
            Name: 'comp2',
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Status: 'DEPLOYED',
            Outputs: [{
                Key: 'LOOK',
                Value: 'MY_VALUE'
            }]
        }

        const dependentComponentObservation = createNewObservation(
            Component.EntityObservation,
            dependentComponent,
            generateTraceId()
        );

        const deployment: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: 'abcdefg',
            User: 'jenkins',
            PolicyNames: ['test'],
            Components: [
                {
                    Name: 'comp1',
                    Provider: {
                        Name: 'hardcoded'
                    },
                    Inputs: [
                        {Key: 'foo', Value: '${myenv:comp2:LOOK}'}
                    ]
                },
                {
                    Name: 'comp2',
                    Provider: {
                        Name: 'hardcoded'
                    },
                    Inputs: [
                        {Key: 'LOOK', Value: 'THE_VALUE'}
                    ]
                }
            ]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [], // ComponentDeployments,
                [dependentComponentObservation], // Components
                [openPolicyObservation]
            ],
            {time: new Date()}
        );
        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Name: 'comp1',
                    Status: "WAITING_ON_DEPENDENT_DEPLOYMENT",
                    StatusReason: [
                        'Dependency found on component in template: myenv:comp2'
                    ]
                })
            ])
        );
    });

    it('Deployment is denied in policy', () => {
        const denyPolicy: Policy.DataSchema = {
            PolicyName: 'no',
            Statements: [{
                Effect: 'Deny',
                Actions: ['deploy:*'],
                Resources: ['*']
            }]
        }

        const denyPolicyObservation = createNewObservation(
            Policy.EntityObservation,
            denyPolicy,
            generateTraceId()
        );

        const deployment: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: 'abcdefg',
            User: 'jenkins',
            PolicyNames: ['test', 'no'],
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'hardcoded'
                },
                Inputs: [
                    {Key: 'foo', Value: 'bar'}
                ]
            }]
        }

        const deploymentObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deployment,
            generateTraceId()
        )

        const resp = handler(
            deploymentObservation,
            [
                [], // Deployment
                [], // ComponentDeployments,
                [], // Components
                [openPolicyObservation, denyPolicyObservation]
            ],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
        expect(resp[0].data.Components[0].Status).toEqual('UNAUTHORIZED');
        expect(resp[0].data.Components[0].StatusReason).toEqual([
            "jenkins is not authorized to perform deploy:write on myenv:comp1"
        ])
    });
});