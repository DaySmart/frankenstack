import { createNewObservation, generateTraceId } from 'o18k-ts-aws';
import { JobRun } from '../Entities/JobRun';
import { Deployment } from '../Entities/Deployment';
import handler from './DeploymentDecider_JobRunHandler';

describe('DeploymentDecider JobRunHandler', () => {
    it('JobRun marks ComponentDeployment in-progress', () => {
        const dependentDeployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'myenv',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Start: new Date().toISOString(),
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'hardcoded'},
                Status: 'ACCEPTED'
            }]
        };

        const dependentDeploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            dependentDeployment,
            generateTraceId()
        );

        const jobRun: JobRun.DataSchema = {
            DeploymentGuid: 'abcdefg',
            ComponentName: 'comp1',
            JobRunGuid: 'hijklmnop',
            Type: 'CODEBUILD',
            CloudWatchLogGroup: 'loggroup',
            CloudWatchLogStream: 'abcdefg',
            Env: 'dev'
        };

        const jobRunObservation = createNewObservation(
            JobRun.EntityObservation,
            jobRun,
            generateTraceId()
        );
        
        const resp = handler(
            jobRunObservation,
            [[dependentDeploymentObservation]],
            {time: new Date()}
        );

        expect(resp[0].data.Components[0].Status).toEqual('DEPLOY_IN_PROGRESS');
    });

    it('JobRun marks ComponentDeployment failed when it includes error', () => {
        const dependentDeployment: Deployment.DataSchema = {
            DeploymentGuid: 'abcdefg',
            Env: 'myenv',
            Status: 'DEPLOY_IN_PROGRESS',
            User: 'jenkins',
            Start: new Date().toISOString(),
            Components: [{
                Name: 'comp1',
                Provider: {Name: 'hardcoded'},
                Status: 'ACCEPTED'
            }]
        };

        const dependentDeploymentObservation = createNewObservation(
            Deployment.EntityObservation,
            dependentDeployment,
            generateTraceId()
        );

        const jobRun: JobRun.DataSchema = {
            DeploymentGuid: 'abcdefg',
            ComponentName: 'comp1',
            JobRunGuid: 'hijklmnop',
            Type: 'CODEBUILD',
            CloudWatchLogGroup: 'loggroup',
            CloudWatchLogStream: 'abcdefg',
            Error: 'Bad',
            Env: 'dev'
        };

        const jobRunObservation = createNewObservation(
            JobRun.EntityObservation,
            jobRun,
            generateTraceId()
        );
        
        const resp = handler(
            jobRunObservation,
            [[dependentDeploymentObservation]],
            {time: new Date()}
        );

        expect(resp[0].data.Components[0].Status).toEqual('DEPLOYMENT_FAILED');
        expect(resp[0].data.Components[0].StatusReason).toEqual(['Bad']);
        expect(resp[0].data.Status).toEqual('DEPLOYMENT_FAILED');
    });
})