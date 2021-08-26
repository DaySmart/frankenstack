import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { Deployment } from "../../generated/Entities/Deployment";
import { getProviderAccountComponentLookups } from './providerLookups';

describe('Provider config lookups', () => {
    it('Account component names for lookup', () => {
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
            },
        {
            Name: 'comp2',
            Provider: {
                Name: 'custom',
                Config: [{
                    Key: 'account',
                    Value: '${prod:aws}'
                }]
            },
            Status: 'ACCEPTED'
        }]
        }

        const deploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            deployment,
            generateTraceId()
        );

        const lookups = getProviderAccountComponentLookups(deploymentObservation);

        expect(lookups).toEqual(['sandbox:aws', 'prod:aws']);
    });

    it('Account component names only includes lookup params', () => {
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
                        Value: '123456'
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

        const lookups = getProviderAccountComponentLookups(deploymentObservation);

        expect(lookups).toEqual([]);
    })
});