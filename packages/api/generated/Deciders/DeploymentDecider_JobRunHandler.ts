import { Context } from 'o18k-ts-aws';
import { Deployment } from '../Entities/Deployment';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { JobRun } from '../Entities/JobRun';
import { createNewObservation, Observation2 } from '../Observation2';

export default function DeploymentDecider_JobRunHandler(
	observation: Observation2<JobRun.EntityObservation>,
	dependentObservations: Observation2<IEntityObservation>[][],
	_context: Context
): Observation2<Deployment.EntityObservation>[] {
	const decisions: Observation2<Deployment.EntityObservation>[] = [];

	const data = observation.data;
	const latestDeployment = dependentObservations[0][0] as Deployment.EntityObservation;

	const deployment: Deployment.DataSchema = {
		DeploymentGuid: observation.data.DeploymentGuid,
		Env: latestDeployment.data.Env,
		Start: latestDeployment.data.Start,
		User: latestDeployment.data.User,
		Status: latestDeployment.data.Status,
		Components: latestDeployment.data.Components.map(component => {
			if(component.Name === data.ComponentName) {
				const componentStatus: Deployment.ComponentDeploymentStatus = data.Error ? 'DEPLOYMENT_FAILED' : 'DEPLOY_IN_PROGRESS';
				const statusReason: Array<string> = component.StatusReason || [];
				if(data.Error) {
					statusReason.push(data.Error as string);
				}
				return { ...component, Status: componentStatus, StatusReason: statusReason};
			} else {
				return component;
			}
		}),
		Method: latestDeployment.data.Method
	};

	if(deployment.Components.every(component => component.Status === 'DEPLOYED')) {
		deployment.Status = 'DEPLOYED';
		deployment.Finish = new Date().toISOString();
	} else if (deployment.Components.every(component => ['DEPLOYED', 'DEPLOYMENT_FAILED', 'UNAUTHORIZED'].includes(component.Status as string))) {
		deployment.Status = 'DEPLOYMENT_FAILED';
		deployment.Finish = new Date().toISOString();
	}

	decisions.push(createNewObservation(Deployment.EntityObservation, deployment, observation.traceid));

	return decisions;
}