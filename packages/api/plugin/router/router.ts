// import aws from "aws-sdk";
// import { Action } from "../../generated/Action";
// import { Decider } from "../../generated/Decider";
// import { generateTraceId, Observation2 } from "../../generated/Observation2";
// import { IEntityObservation } from "../../generated/Entities/IEntityObservation";
// import { filters } from "../repository/repository";
// import { DeploymentForm } from "../../generated/Entities/DeploymentForm";
// import { Deployment } from "../../generated/Entities/Deployment";
// import { ComponentDeployment } from "../../generated/Entities/ComponentDeployment";
// import { DeploymentDecider_DeploymentFormHandler } from "../../generated/Deciders/DeploymentDecider_DeploymentFormHandler";
// import { ComponentDeploymentDecider_DeploymentHandler } from "../../generated/Deciders/ComponentDeploymentDecider_DeploymentHandler";
// import { JobRunAction } from "../../generated/Actions/JobRunAction";
// import { GraphqlAction } from "../../generated/Actions/GraphqlAction";
// import { DeploymentUpdate } from "../../generated/Entities/DeploymentUpdate";
// import { Component } from "../../generated/Entities/Component";
// import { DeploymentUpdateDecider_ComponentHandler } from "../../generated/Deciders/DeploymentUpdateDecider_ComponentHandler";
// import { JobRunFinished } from "../../generated/Entities/JobRunFinished";
// import { ComponentDecider_JobRunFinishedHandler } from "../../generated/Deciders/ComponentDecider_JobRunFinishedHandler";
// import { JobRun } from "../../generated/Entities/JobRun";
// import { DeploymentUpdateDecider_JobRunHandler } from "../../generated/Deciders/DeploymentUpdateDecider_JobRunHandler";
// import { JobRunUpdate } from "../../generated/Entities/JobRunUpdate";
// import { DeploymentUpdateDecider_JobRunUpdateHandler } from "../../generated/Deciders/DeploymentUpdateDecider_JobRunUpdateHandler";
// import { DeploymentDecider_ComponentHandler } from "../../generated/Deciders/DeploymentDecider_ComponentHandler";
// import { DeploymentUpdateDecider_DeploymentHandler } from "../../generated/Deciders/DeploymentUpdateDecider_DeploymentHandler";
// import { getComponentLookup } from "../../src/utils/parseInputs";
// import { Provider } from "../../generated/Entities/Provider";
// import { ProviderDecider_ComponentHandler } from "../../generated/Deciders/ProviderDecider_ComponentHandler";
// import { PutUserMutation } from "../../generated/Entities/PutUserMutation";
// import { PutPolicyMutation } from "../../generated/Entities/PutPolicyMutation";
// import { User } from "../../generated/Entities/User";
// import { UserDecider_PutUserMutationHandler } from "../../generated/Deciders/UserDecider_PutUserMutationHandler";
// import { Policy } from "../../generated/Entities/Policy";
// import { PolicyDecider_PutPolicyMutationHandler } from "../../generated/Deciders/PolicyDecider_PutPolicyMutationHandler";
// export const lambda = new aws.Lambda();

// export const DEPLOYMENT_DECIDER = "DeploymentDecider";
// export const COMPONENT_DEPLOYMENT_DECIDER = "ComponentDeploymentDecider";
// export const DEPLOYMENT_UPDATE_DECIDER = "DeploymentUpdateDecider";
// export const COMPONENT_DECIDER = "ComponentDecider";
// export const PROVIDER_DECIDER = "ProviderDecider";
// export const USER_DECIDER = "UserDecider";
// export const POLICY_DECIDER = "PolicyDecider";
// export const JOB_RUN_ACTION = "JobRunAction";
// export const GRAPHQL_ACTION = "GraphqlAction";

// export const sendAsyncLambda = async (functionName: string, destination: string, observation: Observation2<IEntityObservation>) => {
//   return lambda
//     .invokeAsync({
//       FunctionName: functionName,
//       InvokeArgs: JSON.stringify({ destination, observation })
//     })
//     .promise();
// };

// export async function send(observations: Observation2<IEntityObservation>[], context, log) {
//   let deciderFunctionName = process.env.DECIDER_LAMBDA_FUNCTION_NAME;
//   if (!deciderFunctionName) {
//     deciderFunctionName = context.functionName;
//   }

//   let actionFunctionName = process.env.HTTP_ACTION_FUNCTION_NAME;
//   if (!actionFunctionName) {
//     actionFunctionName = context.functionName;
//   }

//   if (observations.length > 0) {
//     const entityType = observations[0].data.name;
//     if (observations.some(o => o.data.name !== entityType)) {
//       throw new Error("Only allowed to route one entity type.");
//     }
//   }

//   const destinations: any[] = [];
//   observations.forEach(observation => {
//     if (observation.entity === DeploymentForm.ENTITY_NAME && observation.type === DeploymentForm.TYPE) {
//       destinations.push({
//         functionName: deciderFunctionName,
//         destination: DEPLOYMENT_DECIDER,
//         observation
//       });
//     } else if (observation.entity === Deployment.ENTITY_NAME && observation.type === Deployment.TYPE) {
//       destinations.push({
//         functionName: deciderFunctionName,
//         destination: COMPONENT_DEPLOYMENT_DECIDER,
//         observation
//       });

//       destinations.push({
//         functionName: deciderFunctionName,
//         destination: DEPLOYMENT_UPDATE_DECIDER,
//         observation
//       });
//     } else if (observation.entity === ComponentDeployment.ENTITY_NAME && observation.type === ComponentDeployment.TYPE) {
//       destinations.push({
//         functionName: actionFunctionName,
//         destination: JOB_RUN_ACTION,
//         observation
//       });
//     } else if (observation.entity === Component.ENTITY_NAME && observation.type === Component.TYPE) {
//       destinations.push({
//         functionName: deciderFunctionName,
//         destination: DEPLOYMENT_UPDATE_DECIDER,
//         observation
//       });

//       destinations.push({
//         functionName: deciderFunctionName,
//         destination: DEPLOYMENT_DECIDER,
//         observation
//       });

//     destinations.push({
//       functionName: deciderFunctionName,
//       destination: PROVIDER_DECIDER,
//       observation
//     })
//   } else if (
//     observation.entity === DeploymentUpdate.ENTITY_NAME &&
//     observation.type === DeploymentUpdate.TYPE
//   ) {
//     destinations.push({
//       functionName: actionFunctionName,
//       destination: GRAPHQL_ACTION,
//       observation
//     })
//   } else if (
//     observation.entity === JobRunFinished.ENTITY_NAME &&
//     observation.type === JobRunFinished.TYPE
//   ) {
//     destinations.push({
//       functionName: deciderFunctionName,
//       destination: COMPONENT_DECIDER,
//       observation
//     })
//   } else if (
//     observation.entity === JobRun.ENTITY_NAME &&
//     observation.type === JobRun.TYPE
//   ) {
//     destinations.push({
//       functionName: deciderFunctionName,
//       destination: DEPLOYMENT_UPDATE_DECIDER,
//       observation
//     })
//   } else if (
//     observation.entity === JobRunUpdate.ENTITY_NAME &&
//     observation.type === JobRunUpdate.TYPE
//   ) {
//     destinations.push({
//       functionName: deciderFunctionName,
//       destination: DEPLOYMENT_UPDATE_DECIDER,
//       observation
//     })
//   } else if (
//     observation.entity === PutUserMutation.ENTITY_NAME &&
//     observation.type === PutPolicyMutation.TYPE
//   ) {
//     destinations.push({
//       functionName: deciderFunctionName,
//       destination: USER_DECIDER,
//       observation
//     })
//   } else if (
//     observation.entity === PutPolicyMutation.ENTITY_NAME &&
//     observation.type === PutPolicyMutation.TYPE
//   ) {
//     destinations.push({
//       functionName: deciderFunctionName,
//       destination: POLICY_DECIDER,
//       observation
//     })
//   }
// });

//   log("[router] destinations", {
//     decisions: observations.map(o => o.entity),
//     destinations: destinations.map(d => d.destination)
//   });

//   const promises = destinations.map(({ functionName, destination, observation }) => sendAsyncLambda(functionName, destination, observation));
//   if (!process.env.LOCAL_TESTING) {
//     const result = await Promise.all(promises);
//     log("[router] invoke response", { result });
//   }
//   return destinations;
// }

// export function receiveDecider(event, _context, log, repository): Decider<IEntityObservation> {
//   const observation = new Observation2<IEntityObservation>(event.observation);

//   switch (event.destination) {
//     case DEPLOYMENT_DECIDER:
//       if (observation.entity === DeploymentForm.ENTITY_NAME) {
//         return new Decider<Deployment.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 Deployment.ENTITY_NAME,
//                 Deployment.TYPE,
//                 observation.entityid
//               ]
//             }
//           ],
//           new DeploymentDecider_DeploymentFormHandler(
//             observation
//           ),
//           log,
//           repository
//         );
//       } else if (observation.entity === Component.ENTITY_NAME) {
//         return new Decider<Deployment.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 Deployment.ENTITY_NAME,
//                 Deployment.TYPE,
//                 observation.data.DeploymentGuid
//               ]
//             }
//           ],
//           new DeploymentDecider_ComponentHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       }
//     case COMPONENT_DEPLOYMENT_DECIDER:
//       if (observation.entity === Deployment.ENTITY_NAME) {
//         return new Decider<ComponentDeployment.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 Deployment.ENTITY_NAME,
//                 Deployment.TYPE,
//                 observation.entityid
//               ]
//             },
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_ENTITYID_IN_LIST,
//               filterValues: [
//                 ComponentDeployment.ENTITY_NAME,
//                 ComponentDeployment.TYPE,
//                 ...observation.data.Components.map(component => {
//                   return `${observation.data.DeploymentGuid}:${observation.data.Env}:${component.Name}`
//                 })
//               ]
//             },
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_ENTITYID_IN_LIST,
//               filterValues: [
//                 Component.ENTITY_NAME,
//                 Component.TYPE,
//                 ...getComponentLookup(observation)
//               ]
//             },
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_ENTITYID_IN_LIST,
//               filterValues: [
//                 Provider.ENTITY_NAME,
//                 Provider.TYPE,
//                 ...observation.data.Components.map(component => component.Provider.Name)
//               ]
//             }
//           ],
//           new ComponentDeploymentDecider_DeploymentHandler(
//             observation
//           ),
//           log,
//           repository
//         );
//       }
//     case DEPLOYMENT_UPDATE_DECIDER:
//       if (observation.entity === Component.ENTITY_NAME) {
//         return new Decider<DeploymentUpdate.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 DeploymentUpdate.ENTITY_NAME,
//                 DeploymentUpdate.TYPE,
//                 observation.entityid
//               ]
//             }
//           ],
//           new DeploymentUpdateDecider_ComponentHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       } else if (observation.entity === JobRun.ENTITY_NAME) {
//         return new Decider<DeploymentUpdate.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 DeploymentUpdate.ENTITY_NAME,
//                 DeploymentUpdate.TYPE,
//                 observation.entityid
//               ]
//             }
//           ],
//           new DeploymentUpdateDecider_JobRunHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       } else if (observation.entity === JobRunUpdate.ENTITY_NAME) {
//         return new Decider<DeploymentUpdate.EntityObservation>(
//             generateTraceId(observation.traceid),
//             [
//                 {
//                     filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//                     filterValues: [
//                         JobRun.ENTITY_NAME,
//                         JobRun.TYPE,
//                         observation.entityid
//                     ]
//                 }
//             ],
//             new DeploymentUpdateDecider_JobRunUpdateHandler(
//                 observation
//             ),
//             log,
//             repository
//         )
//       } else if (observation.entity === Deployment.ENTITY_NAME) {
//         return new Decider<DeploymentUpdate.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//                 filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_ENTITYID_IN_LIST,
//                 filterValues: [
//                   Component.ENTITY_NAME,
//                   Component.TYPE,
//                   ...observation.data.Components.map(component => {
//                     return `${observation.data.Env}:${component.Name}`
//                   })
//                 ]
//             },
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_ENTITYID_IN_LIST,
//               filterValues: [
//                 ComponentDeployment.ENTITY_NAME,
//                 ComponentDeployment.TYPE,
//                 ...observation.data.Components.map(component => {
//                   return `${observation.data.DeploymentGuid}:${observation.data.Env}:${component.Name}`
//                 })
//               ]
//             }
//           ],
//           new DeploymentUpdateDecider_DeploymentHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       }
//     case COMPONENT_DECIDER:
//       if(observation.entity === JobRunFinished.ENTITY_NAME) {
//         return new Decider<Component.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 Component.ENTITY_NAME,
//                 Component.TYPE,
//                 `${observation.data.Env}:${observation.data.Name}`
//               ]
//             }
//           ],
//           new ComponentDecider_JobRunFinishedHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       }
//     case PROVIDER_DECIDER:
//       if(observation.entity === Component.ENTITY_NAME) {
//         return new Decider<Provider.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 ComponentDeployment.ENTITY_NAME,
//                 ComponentDeployment.TYPE,
//                 `${observation.data.DeploymentGuid}:${observation.data.Env}:${observation.data.Name}`
//               ]
//             }
//           ],
//           new ProviderDecider_ComponentHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       }
//     case USER_DECIDER:
//       if(observation.entity === PutUserMutation.ENTITY_NAME) {
//         return new Decider<User.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 User.ENTITY_NAME,
//                 User.TYPE,
//                 observation.data.UserId
//               ]
//             }
//           ],
//           new UserDecider_PutUserMutationHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       }
//     case POLICY_DECIDER:
//       if(observation.entity === PutPolicyMutation.ENTITY_NAME) {
//         return new Decider<Policy.EntityObservation>(
//           generateTraceId(observation.traceid),
//           [
//             {
//               filter: filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//               filterValues: [
//                 Policy.ENTITY_NAME,
//                 Policy.TYPE,
//                 observation.data.PolicyName
//               ]
//             }
//           ],
//           new PolicyDecider_PutPolicyMutationHandler(
//             observation
//           ),
//           log,
//           repository
//         )
//       }
//     default:
//       throw new Error("destination not supported");
//   }
// }

// export function receiveAction(event, _context, log, repository): Action {
//   switch (event.destination) {
//     case JOB_RUN_ACTION:
//       return new JobRunAction(new Observation2<ComponentDeployment.EntityObservation>(event.observation), log, repository);
//     case GRAPHQL_ACTION:
//       return new GraphqlAction(new Observation2<DeploymentUpdate.EntityObservation>(event.observation), log, repository);
//     default:
//       throw new Error("destination not supported");
//   }
// }
