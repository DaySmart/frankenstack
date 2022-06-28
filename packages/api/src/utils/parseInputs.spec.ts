import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { getComponentDependentsForRemoveComponentRequest } from './parseInputs';
import { DeploymentRequest } from '../../generated/Entities/DeploymentRequest';
import { RemoveComponentRequest } from '../../generated/Entities/RemoveComponentRequest';

describe('parseInputs', () => {

    it('getComponentDependentsForRemoveComponentRequest returns dependent component names', () => {

        const deploymentRequest: DeploymentRequest.DataSchema = {
            Env: 'myenv',
            DeploymentGuid: 'abcdefg',
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

        const lastComponentDeployments: Array<RemoveComponentRequest.LastComponentDeployment> = [
            {
                ComponentName: 'comp2',
                LastDeploymentGuid: 'abcdefg'
            },
            {
                ComponentName: 'comp1',
                LastDeploymentGuid: 'abcdefg'
            },
            {
                ComponentName: 'comp3',
                LastDeploymentGuid: 'abcdefg'
            }
        ];

        const deploymentRequestObservation = createNewObservation(
            DeploymentRequest.EntityObservation,
            deploymentRequest,
            generateTraceId()
        );

        const resp = getComponentDependentsForRemoveComponentRequest('myenv', 'comp1', lastComponentDeployments, [deploymentRequestObservation]);
        expect(resp).toEqual(
            expect.arrayContaining(['comp2', 'comp3'])
        );
    })
})