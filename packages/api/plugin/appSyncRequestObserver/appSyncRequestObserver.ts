// import log from "../log/log";
// // import generateObservationFromAppSync from "./generateObservationFromAppsync";
// // import { send } from "../router/router";
// // import { DynamoDbRepository, filters } from "../repository/repository";
// // import generateObservationFromAppSync from "./generateObservationFromAppsync";
// // import { ComponentRollbackQuery } from "../../generated/Entities/ComponentRollbackQuery";
// // import { Component } from "../../generated/Entities/Component";
// // import { ComponentDeployment } from "../../generated/Entities/ComponentDeployment";
// // import { ResolvedInputsQuery } from "../../generated/Entities/ResolvedInputsQuery";
// // import { getComponentLookup, replaceComponentInputLookups } from "../../src/utils/parseInputs";

import { appSyncRequestObserver } from 'o18k-ts-aws';
import { getTemplate } from '../../template';

export async function appSyncRequestObserverWrapper(event, context) {
	const template = getTemplate();
	console.log({ template });
	return appSyncRequestObserver(event, context, template);
}

//   log("[graphqlRequestObserver] request", { event, context }, event, context);

//   //     const repository = new DynamoDbRepository();

//   // const [observation] = generateObservationFromAppSync(event, context);
//   //     log("[graphqlRequestObserver] observation", { observation }, event, context);

//   //     if (observation) {
//   //         await repository.save([observation]);
//   //     }

//   //     if (observation.entity === ComponentRollbackQuery.ENTITY_NAME) {
//   //         const componentResults = await repository.load([
//   //             {
//   //                 filter: filters.TOP_2_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//   //                 filterValues: [
//   //                     Component.ENTITY_NAME,
//   //                     Component.TYPE,
//   //                     `${observation.data.Env}:${observation.data.ComponentName}`
//   //                 ]
//   //             }
//   //         ]);

//   //         log("[graphqlRequestObserver] componentObservation", { componentResults }, event, context);

//   //         if(!componentResults[0][1]) {
//   //             return {}
//   //         }

//   //         let component: Component.EntityObservation = componentResults[0][1];
//   //         const componentDeploymentResult = await repository.load([
//   //             {
//   //                 filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//   //                 filterValues: [
//   //                     ComponentDeployment.ENTITY_NAME,
//   //                     ComponentDeployment.TYPE,
//   //                     `${component.data.DeploymentGuid}:${observation.data.Env}:${observation.data.ComponentName}`
//   //                 ]
//   //             }
//   //         ]);

//   //         log("[graphqlRequestObserver] componentDeploymentObservation", { componentDeploymentResult }, event, context);

//   //         if(!componentDeploymentResult[0][0]) {
//   //             return {}
//   //         }

//   //         const componentDeployment: ComponentDeployment.EntityObservation = componentDeploymentResult[0][0];

//   //         return {
//   //             deploymentGuid: componentDeployment.data.DeploymentGuid,
//   //             env: componentDeployment.data.Env,
//   //             name: componentDeployment.data.Name,
//   //             provider: {
//   //                 name: componentDeployment.data.Provider.Name,
//   //                 config: componentDeployment.data.Provider.Config ?
//   //                     componentDeployment.data.Provider.Config.map(configItem => {
//   //                         return {
//   //                             name: configItem.Key,
//   //                             value: configItem.Value
//   //                         }
//   //                     }) : undefined
//   //             },
//   //             inputs: componentDeployment.data.Inputs ?
//   //                 componentDeployment.data.Inputs.map(input => {
//   //                     return {
//   //                         name: input.Key,
//   //                         value: input.Value
//   //                     }
//   //                 }) : undefined,
//   //             outputs: component.data.Outputs ?
//   //                 component.data.Outputs.map(output => {
//   //                     return {
//   //                         name: output.Key,
//   //                         value: output.Value
//   //                     }
//   //                 }) : undefined
//   //         }
//   //     } else if (observation.entity === ResolvedInputsQuery.ENTITY_NAME) {
//   //         const dependentObservations = await repository.load([{
//   //             filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_ENTITYID_IN_LIST,
//   //             filterValues: [
//   //                 Component.ENTITY_NAME,
//   //                 Component.TYPE,
//   //                 ...getComponentLookup(observation)
//   //             ]
//   //         }]);

//   //         const dependentComponentObservations = dependentObservations[0];

//   //         const resolvedObservation = replaceComponentInputLookups(observation, dependentComponentObservations);
//   //         log("[graphqlRequestObserver] resolvedInputsObservation", { resolvedObservation }, event, context);
//   //         return resolvedObservation.data.Component.Inputs.map(input => {return {name: input.Key, value: input.Value}});
//   //     } else {
//   //         const response = await send([observation], context, log);
//   //         log("[graphqlRequestObserver] invoke response", { response }, event, context);
//   //         return true;
//   //     }
// }
