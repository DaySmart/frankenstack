import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { Deployment } from '../Entities/Deployment';
import handler from './DeploymentDecider_RemoveComponentRequestHandler';
import { RemoveComponentRequest } from '../Entities/RemoveComponentRequest';
import { Policy } from '../Entities/Policy';
import { DeploymentRequest } from '../Entities/DeploymentRequest';

describe('DeploymentDecider RemoveComponentRequestHandler', () => {
    it('Happy Path', () => {   // 
        const lastDeploymentGuid = 'abcdefg';

        const dependentDeployment: Deployment.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: lastDeploymentGuid,
            Status: 'DEPLOYMENT_FAILED',
            User: 'jenkins',
            Start: new Date().toISOString(),
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'hardcoded'},
                Status: 'ACCEPTED'
            }]
        }

        const dependentDeploymentRequest: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: lastDeploymentGuid,
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'hardcoded'}
            }],
            PolicyNames: [],
            User: 'jenkins'
        }

        const dependentDeploymentRequestObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            dependentDeploymentRequest,
            generateTraceId()
        );

        const removeComponentRequest: RemoveComponentRequest.DataSchema = {
            DeploymentGuid: 'hijklm',
            ComponentDeployments: [{ ComponentName: 'comp1', LastDeploymentGuid: lastDeploymentGuid}],
            Env: 'myenv',
            User: 'jenkins',
            PolicyNames: ['policy1'] 
           // CloudWatchLogGroup: 'loggroup',
            //CloudWatchLogStream: 'abcdefg'
        };

        const dependentDeploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            dependentDeployment,
            generateTraceId()
        );

        const policy: Policy.DataSchema = {
            PolicyName: 'policy1',
            Statements: [{
                Actions: ['*'],
                Effect: 'Allow',
                Resources: ['*']
            }]
        }

        const dependentPolicyObservation = createNewObservation(
            Policy.EntityObservation,
            policy,
            generateTraceId()
        );

        const removeComponentRequestObservation = createNewObservation(
            RemoveComponentRequest.EntityObservation,
            removeComponentRequest,
            generateTraceId()
        );

        const resp = handler(
            removeComponentRequestObservation,
            [[dependentDeploymentObservation], [dependentPolicyObservation], [dependentDeploymentRequestObservation]],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Name: 'comp1',
                    Provider: {"Config": [{
                        Key: "artifactOverideGuid",
                        Value: 'abcdefg'}],
                        Name: 'hardcoded'},
                    Status: 'ACCEPTED',
                    StatusReason: [],

                })
            ])
        );
        // expect(resp[0].data.Finish).toBeTruthy();
    });

    it('Created proper components, input, and outputs Happy Path',() => {
        const lastDeploymentGuid = 'abcdefg';

        const dependentDeployment: Deployment.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: lastDeploymentGuid,
            Status: 'DEPLOYMENT_FAILED',
            User: 'jenkins',
            Start: new Date().toISOString(),
            Components: [{
                Inputs: [{
                    Key: 'input',
                    Value: 'value'
                }],
                Outputs: [{
                    Key: 'output',
                    Value: 'outputValue'
                }],
                Name: 'comp1',
                Provider: {Name: 'hardcoded',
                Config: [{
                    Key: 'account',
                    Value: '${sandbox:aws}'
                }]},
                Status: 'ACCEPTED'
            }]
        }

        const dependentDeploymentRequest: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: lastDeploymentGuid,
            Components: [{
                Name: 'comp1',
                Provider: {
                    Name: 'hardcoded',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]
                },
                Inputs: [{
                    Key: 'input',
                    Value: 'value'
                }],
                Outputs: [{
                    Key: 'output',
                    Value: 'outputValue'
                }],
            }],
            PolicyNames: [],
            User: 'jenkins'
        }

        const dependentDeploymentRequestObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            dependentDeploymentRequest,
            generateTraceId()
        );

        const removeComponentRequest: RemoveComponentRequest.DataSchema = {
            DeploymentGuid: 'hijklm',
            ComponentDeployments: [{ ComponentName: 'comp1', LastDeploymentGuid: lastDeploymentGuid}],
            Env: 'myenv',
            User: 'jenkins',
            PolicyNames: ['policy1'] 
           // CloudWatchLogGroup: 'loggroup',
            //CloudWatchLogStream: 'abcdefg'
        };

        const removeComponentRequestObservation = createNewObservation(
            RemoveComponentRequest.EntityObservation,
            removeComponentRequest,
            generateTraceId()
        );

        const dependentDeploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            dependentDeployment,
            generateTraceId()
        );

        const policy: Policy.DataSchema = {
            PolicyName: 'policy1',
            Statements: [{
                Actions: ['*'],
                Effect: 'Allow',
                Resources: ['*']
            }]
        }

        const dependentPolicyObservation = createNewObservation(
            Policy.EntityObservation,
            policy,
            generateTraceId()
        );

        const resp = handler(
            removeComponentRequestObservation,
            [[dependentDeploymentObservation], [dependentPolicyObservation], [dependentDeploymentRequestObservation]],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Inputs: [{
                        Key: 'input',
                        Value: 'value'
                    }],
                    Outputs: [{
                        Key: 'output',
                        Value: 'outputValue'
                    }],
                    Name: 'comp1',
                    Provider: {"Config": [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    },
                    {
                        Key: "artifactOverideGuid",
                        Value: 'abcdefg'},
                        ],
                        Name: 'hardcoded'},

                })
            ])
        );
    });

    it('Components with dependents have status set to wait',() => {
        const lastDeploymentGuid = 'abcdefg';

        const dependentDeployment: Deployment.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: lastDeploymentGuid,
            Status: 'DEPLOYED',
            User: 'jenkins',
            Start: new Date().toISOString(),
            Components: [
                {
                    Inputs: [{
                        Key: 'input',
                        Value: 'value'
                    }],
                    Name: 'comp1',
                    Provider: {Name: 'hardcoded',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]},
                    Status: 'DEPLOYED'
                },
                {
                    Name: 'comp2',
                    Inputs: [{
                        Key: 'input',
                        Value: 'value'
                    }],
                    Provider: {Name: 'hardcoded',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]},
                    Status: 'DEPLOYED'
                },
                {
                    Name: 'comp3',
                    Inputs: [
                        { Key: 'input1', Value: 'value'},
                        { Key: 'input2', Value: 'value'}
                    ],
                    Provider: { Name: 'hardcoded'},
                    Status: 'DEPLOYED'
                }
            ]
        }

        const dependentDeploymentRequest: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: lastDeploymentGuid,
            Components: [
                {
                    Name: 'comp1',
                    Provider: {
                        Name: 'hardcoded',
                        Config: [{
                            Key: 'account',
                            Value: '${sandbox:aws}'
                        }]
                    },
                    Inputs: [{
                        Key: 'input',
                        Value: 'value'
                    }]
                },
                {
                    Name: 'comp2',
                    Inputs: [{
                        Key: 'input',
                        Value: '${myenv:comp1:input}'
                    }],
                    Provider: {Name: 'hardcoded',
                    Config: [{
                        Key: 'account',
                        Value: '${sandbox:aws}'
                    }]},
                },
                {
                    Name: 'comp3',
                    Inputs: [
                        { Key: 'input1', Value: '${myenv:comp1:input}'},
                        { Key: 'input2', Value: '${myenv:comp2:input}'}
                    ],
                    Provider: { Name: 'hardcoded'},
                }
            ],
            PolicyNames: [],
            User: 'jenkins'
        }

        const dependentDeploymentRequestObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            dependentDeploymentRequest,
            generateTraceId()
        );

        const removeComponentRequest: RemoveComponentRequest.DataSchema = {
            DeploymentGuid: 'hijklm',
            ComponentDeployments: [
                { ComponentName: 'comp1', LastDeploymentGuid: lastDeploymentGuid},
                { ComponentName: 'comp2', LastDeploymentGuid: lastDeploymentGuid},
                { ComponentName: 'comp3', LastDeploymentGuid: lastDeploymentGuid}
            ],
            Env: 'myenv',
            User: 'jenkins',
            PolicyNames: ['policy1'] 
           // CloudWatchLogGroup: 'loggroup',
            //CloudWatchLogStream: 'abcdefg'
        };

        const removeComponentRequestObservation = createNewObservation(
            RemoveComponentRequest.EntityObservation,
            removeComponentRequest,
            generateTraceId()
        );

        const dependentDeploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            dependentDeployment,
            generateTraceId()
        );

        const policy: Policy.DataSchema = {
            PolicyName: 'policy1',
            Statements: [{
                Actions: ['*'],
                Effect: 'Allow',
                Resources: ['*']
            }]
        }

        const dependentPolicyObservation = createNewObservation(
            Policy.EntityObservation,
            policy,
            generateTraceId()
        );

        const resp = handler(
            removeComponentRequestObservation,
            [[dependentDeploymentObservation], [dependentPolicyObservation], [dependentDeploymentRequestObservation]],
            {time: new Date()}
        );

        expect(resp[0].entity).toEqual(Deployment.ENTITY_NAME);
        expect(resp[0].data.Status).toEqual('DEPLOY_IN_PROGRESS');
        expect(resp[0].data.Components).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Inputs: [{
                        Key: 'input',
                        Value: 'value'
                    }],
                    Name: 'comp1',
                    Provider: {
                        Config: [
                            {
                                Key: 'account',
                                Value: '${sandbox:aws}'
                            },
                            {
                                Key: "artifactOverideGuid",
                                Value: 'abcdefg'
                            },
                        ],
                        Name: 'hardcoded'
                    },
                    Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
                    DependsOn: ['comp2', 'comp3']
                })
            ])
        );

        expect(resp[0].data.Components).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Inputs: [{
                        Key: 'input',
                        Value: 'value'
                    }],
                    Name: 'comp2',
                    Provider: {
                        "Config": [
                            {
                                Key: 'account',
                                Value: '${sandbox:aws}'
                            },
                            {
                                Key: "artifactOverideGuid",
                                Value: 'abcdefg'
                            },
                        ],
                        Name: 'hardcoded'
                    },
                    Status: 'WAITING_ON_DEPENDENT_DEPLOYMENT',
                    DependsOn: ['comp3']
                })
            ])
        )

        expect(resp[0].data.Components).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Inputs: [
                        {
                            Key: 'input1',
                            Value: 'value'
                        },
                        {
                            Key: 'input2',
                            Value: 'value'
                        }
                    ],
                    Name: 'comp3',
                    Provider: {
                        Config: [
                             {
                                Key: "artifactOverideGuid",
                                Value: 'abcdefg'
                            },
                        ],
                        Name: 'hardcoded'
                    },
                    Status: 'ACCEPTED'
                })
            ])
        )
    });
})