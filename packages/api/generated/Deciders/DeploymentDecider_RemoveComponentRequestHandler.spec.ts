import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { Deployment } from '../Entities/Deployment';
import handler from './DeploymentDecider_RemoveComponentRequestHandler';
import { RemoveComponentRequest } from '../Entities/RemoveComponentRequest';
import { Policy } from '../Entities/Policy';

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

        const removeComponentRequest: RemoveComponentRequest.DataSchema = {
            DeploymentGuid: 'hijklm',
            ComponentName: 'comp1',
            LastDeploymentGuid: lastDeploymentGuid,
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
            [[dependentDeploymentObservation], [dependentPolicyObservation]],
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

        const removeComponentRequest: RemoveComponentRequest.DataSchema = {
            DeploymentGuid: 'hijklm',
            ComponentName: 'comp1',
            LastDeploymentGuid: lastDeploymentGuid,
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
            [[dependentDeploymentObservation], [dependentPolicyObservation]],
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
})