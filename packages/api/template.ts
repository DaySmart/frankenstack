import {
  APPSYNC_REQUEST_RESPONSE_ACTOR_MODULE,
  filters,
  Template,
} from "o18k-ts-aws";
import createGenericCloudWatchLogObserverHandle from "o18k-ts-aws/dist/modules/cloudwatchLogObserver/createGenericCloudWatchLogObserverHandle";
import GraphqlActor from "./generated/Actors/GraphqlActor";
import JobRunActor from "./generated/Actors/JobRunActor";
import ComponentDecider_JobRunFinishedHandler from "./generated/Deciders/ComponentDecider_JobRunFinishedHandler";
import ComponentDeploymentDecider_DeploymentHandler from "./generated/Deciders/ComponentDeploymentDecider_DeploymentHandler";
import DeploymentDecider_ComponentHandler from "./generated/Deciders/DeploymentDecider_ComponentHandler";
import DeploymentDecider_DeploymentRequestHandler from "./generated/Deciders/DeploymentDecider_DeploymentRequestHandler";
import DeploymentDecider_JobRunHandler from "./generated/Deciders/DeploymentDecider_JobRunHandler";
import DeploymentDecider_RemoveComponentRequestHandler from "./generated/Deciders/DeploymentDecider_RemoveComponentRequestHandler";
import DeploymentRequestDecider_DeploymentFormHandler from "./generated/Deciders/DeploymentRequestDecider_DeploymentFormHandler";
import DeploymentUpdateDecider_ComponentHandler from "./generated/Deciders/DeploymentUpdateDecider_ComponentHandler";
import DeploymentUpdateDecider_DeploymentHandler from "./generated/Deciders/DeploymentUpdateDecider_DeploymentHandler";
import DeploymentUpdateDecider_JobRunHandler from "./generated/Deciders/DeploymentUpdateDecider_JobRunHandler";
import DeploymentUpdateDecider_JobRunUpdateHandler from "./generated/Deciders/DeploymentUpdateDecider_JobRunUpdateHandler";
import JobRunFinishedDecider_ProviderFailureHandler from "./generated/Deciders/JobRunFinishedDecider_ProviderFailureHandler";
import PolicyDecider_PutPolicyMutationHandler from "./generated/Deciders/PolicyDecider_PutPolicyMutationHandler";
import ProviderDecider_ComponentHandler from "./generated/Deciders/ProviderDecider_ComponentHandler";
import RemoveComponentRequestDecider_RemoveComponentMutationHandler from "./generated/Deciders/RemoveComponentRequestDecider_RemoveComponentMutationHandler";
import UserDecider_PutUserMutationHandler from "./generated/Deciders/UserDecider_PutUserMutationHandler";
import { Component } from "./generated/Entities/Component";
import { ComponentDeployment } from "./generated/Entities/ComponentDeployment";
import { ComponentRollbackQuery } from "./generated/Entities/ComponentRollbackQuery";
import { Deployment } from "./generated/Entities/Deployment";
import { DeploymentForm } from "./generated/Entities/DeploymentForm";
import { DeploymentRequest } from "./generated/Entities/DeploymentRequest";
import { DeploymentUpdate } from "./generated/Entities/DeploymentUpdate";
import { DescribeComponentQuery } from "./generated/Entities/DescribeComponentQuery";
import { GetDeploymentRequestQuery } from "./generated/Entities/GetDeploymentRequestQuery";
import { JobRun } from "./generated/Entities/JobRun";
import { JobRunFinished } from "./generated/Entities/JobRunFinished";
import { JobRunUpdate } from "./generated/Entities/JobRunUpdate";
import { Policy } from "./generated/Entities/Policy";
import { Provider } from "./generated/Entities/Provider";
import { ProviderFailure } from "./generated/Entities/ProviderFailure";
import { PutPolicyMutation } from "./generated/Entities/PutPolicyMutation";
import { PutUserMutation } from "./generated/Entities/PutUserMutation";
import { RemoveComponentMutation } from "./generated/Entities/RemoveComponentMutation";
import { RemoveComponentRequest } from "./generated/Entities/RemoveComponentRequest";
import { ResolvedInputsQuery } from "./generated/Entities/ResolvedInputsQuery";
import { User } from "./generated/Entities/User";
import ComponentRollbackQueryHandler from "./generated/Observers/ComponentRollbackQueryHandler";
import { ComponentRollbackQueryResponseHandler } from "./generated/Observers/ComponentRollbackQueryResponseHandler";
import DescribeComponentQueryHandler from "./generated/Observers/DescribeComponentQueryHandler";
import { DescribeComponentQueryResponseHandler } from "./generated/Observers/DescribeComponentQueryResponseHandler";
import GetDeploymentRequestQueryHandler from "./generated/Observers/GetDeploymentRequestQueryHandler";
import { GetDeploymentRequestQueryResponseHandler } from "./generated/Observers/GetDeploymentRequestQueryResponseHandler";
import JobRunFinishedHandler from "./generated/Observers/JobRunFinishedHandler";
import JobRunResponseHandler from "./generated/Observers/JobRunResponseHandler";
import ProviderFailureHandler from "./generated/Observers/ProviderFailureHandler";
import PutPolicyMutationHandler from "./generated/Observers/PutPolicyMutationHandler";
import PutUserMutationHandler from "./generated/Observers/PutUserMutationHandler";
import RemoveComponentMutationHandler from "./generated/Observers/RemoveComponentMutationHandler";
import ResolvedInputsQueryHandler from "./generated/Observers/ResolvedInputsQueryHandler";
import { ResolvedInputsQueryResponseHandler } from "./generated/Observers/ResolvedInputsQueryResponseHandler";
import SendDeploymentFormHandler from "./generated/Observers/SendDeploymentFormHandler";
import { AppSyncRequestObserverModuleInstance } from "./moduleInstances/AppSyncRequestObserverModuleInstance";
import { AppSyncRequestResponseActorModuleInstance } from "./moduleInstances/AppSyncRequestResponseActorModuleInstance";
import { CloudWatchLogObserverModuleInstance } from "./moduleInstances/CloudWatchLogObserverModuleInstance";
import { CustomActorModuleInstance } from "./moduleInstances/CustomActorModuleInstance";
import { CustomResponseObserverModuleInstance } from "./moduleInstances/CustomResponseObserverModuleInstance";
import { EventBridgeObserverModuleInstance } from "./moduleInstances/EventBridgeObserverModuleIntsance";
import { LambdaDeciderModuleInstance } from "./moduleInstances/LambdaDeciderModuleInstance";
import { LoggerModuleInstance } from "./moduleInstances/LoggerModuleInstance";
import { SingletonLambdaDeciderModuleInstance } from "./moduleInstances/SingletonLambdaDeciderModuleInstance";
import { SnsTopicObserverModuleInstance } from "./moduleInstances/SnsTopicObserverModuleInstance";
import { getComponentLookup } from "./src/utils/parseInputs";
import { getProviderAccountComponentLookups } from "./src/utils/providerLookups";

let template: Template;

export function getTemplate(): Template {
  if (template) return template;
  template = {
    defaultLogger: new LoggerModuleInstance(),
    internalEntities: [
      {
        entity: DeploymentRequest.ENTITY_NAME,
        type: DeploymentRequest.TYPE,
        deciderCellsThatCareAboutMe: [
          {
            entity: Deployment.ENTITY_NAME,
            type: Deployment.TYPE,
            cell: new LambdaDeciderModuleInstance(
              DeploymentRequest.ENTITY_NAME,
              DeploymentRequest.TYPE,
              Deployment.ENTITY_NAME,
              Deployment.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [Deployment.ENTITY_NAME, Deployment.TYPE],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    ComponentDeployment.ENTITY_NAME,
                    ComponentDeployment.TYPE,
                    (observation) =>
                      observation.data.Components.map((component) => {
                        return `${observation.data.DeploymentGuid}:${observation.data.Env}:${component.Name}`;
                      }),
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Component.ENTITY_NAME,
                    Component.TYPE,
                    (observation) => getComponentLookup(observation),
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Policy.ENTITY_NAME,
                    Policy.TYPE,
                    (observation) => observation.data.PolicyNames,
                  ],
                },
              ],
              DeploymentDecider_DeploymentRequestHandler
            ),
          },
        ],
      },
      {
        entity: Deployment.ENTITY_NAME,
        type: Deployment.TYPE,
        deciderCellsThatCareAboutMe: [
          {
            entity: ComponentDeployment.ENTITY_NAME,
            type: ComponentDeployment.TYPE,
            cell: new LambdaDeciderModuleInstance(
              Deployment.ENTITY_NAME,
              Deployment.TYPE,
              ComponentDeployment.ENTITY_NAME,
              ComponentDeployment.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    ComponentDeployment.ENTITY_NAME,
                    ComponentDeployment.TYPE,
                    (observation) =>
                      observation.data.Components.map((component) => {
                        return `${observation.data.DeploymentGuid}:${observation.data.Env}:${component.Name}`;
                      }),
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Provider.ENTITY_NAME,
                    Provider.TYPE,
                    (observation) =>
                      observation.data.Components.map(
                        (component) => component.Provider.Name
                      ),
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Component.ENTITY_NAME,
                    Component.TYPE,
                    (observation) =>
                      getProviderAccountComponentLookups(observation),
                  ],
                },
              ],
              ComponentDeploymentDecider_DeploymentHandler
            ),
          },
          {
            entity: DeploymentUpdate.ENTITY_NAME,
            type: DeploymentUpdate.TYPE,
            cell: new LambdaDeciderModuleInstance(
              Deployment.ENTITY_NAME,
              Deployment.TYPE,
              DeploymentUpdate.ENTITY_NAME,
              DeploymentUpdate.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Component.ENTITY_NAME,
                    Component.TYPE,
                    (observation) =>
                      observation.data.Components.map((component) => {
                        return `${observation.data.Env}:${component.Name}`;
                      }),
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    ComponentDeployment.ENTITY_NAME,
                    ComponentDeployment.TYPE,
                    (observation) =>
                      observation.data.Components.map((component) => {
                        return `${observation.data.DeploymentGuid}:${observation.data.Env}:${component.Name}`;
                      }),
                  ],
                },
              ],
              DeploymentUpdateDecider_DeploymentHandler,
              false
            ),
          },
        ],
      },
      {
        entity: ComponentDeployment.ENTITY_NAME,
        type: ComponentDeployment.TYPE,
        actorCellsThatCareAboutMe: [
          {
            module: "CustomActorModule",
            name: "JobRunAction",
            cell: new CustomActorModuleInstance("JobRunAction", JobRunActor),
          },
        ],
      },
      {
        entity: Component.ENTITY_NAME,
        type: Component.TYPE,
        deciderCellsThatCareAboutMe: [
          {
            entity: DeploymentUpdate.ENTITY_NAME,
            type: DeploymentUpdate.TYPE,
            cell: new LambdaDeciderModuleInstance(
              Component.ENTITY_NAME,
              Component.TYPE,
              DeploymentUpdate.ENTITY_NAME,
              DeploymentUpdate.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [
                    DeploymentUpdate.ENTITY_NAME,
                    DeploymentUpdate.TYPE,
                  ],
                },
              ],
              DeploymentUpdateDecider_ComponentHandler,
              false
            ),
          },
          {
            entity: Deployment.ENTITY_NAME,
            type: Deployment.TYPE,
            cell: new SingletonLambdaDeciderModuleInstance(
              Component.ENTITY_NAME,
              Component.TYPE,
              Deployment.ENTITY_NAME,
              Deployment.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_DATA_PROPERTY,
                  filterValues: [
                    Deployment.ENTITY_NAME,
                    Deployment.TYPE,
                    "DeploymentGuid",
                  ],
                },
              ],
              DeploymentDecider_ComponentHandler
            ),
          },
          {
            entity: Provider.ENTITY_NAME,
            type: Provider.TYPE,
            cell: new LambdaDeciderModuleInstance(
              Component.ENTITY_NAME,
              Component.TYPE,
              Provider.ENTITY_NAME,
              Provider.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    ComponentDeployment.ENTITY_NAME,
                    ComponentDeployment.TYPE,
                    (observation) => [
                      `${observation.data.DeploymentGuid}:${observation.data.Env}:${observation.data.Name}`,
                    ],
                  ],
                },
              ],
              ProviderDecider_ComponentHandler
            ),
          },
        ],
      },
      {
        entity: DeploymentUpdate.ENTITY_NAME,
        type: DeploymentUpdate.TYPE,
        actorCellsThatCareAboutMe: [
          {
            module: "CustomActorModule",
            name: "GraphQLAction",
            cell: new CustomActorModuleInstance(
              "GraphQLAction",
              GraphqlActor,
              []
            ),
          },
        ],
      },
      {
        entity: JobRunFinished.ENTITY_NAME,
        type: JobRunFinished.TYPE,
        deciderCellsThatCareAboutMe: [
          {
            entity: Component.ENTITY_NAME,
            type: Component.TYPE,
            cell: new LambdaDeciderModuleInstance(
              JobRunFinished.ENTITY_NAME,
              JobRunFinished.TYPE,
              Component.ENTITY_NAME,
              Component.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Component.ENTITY_NAME,
                    Component.TYPE,
                    (observation) => [
                      `${observation.data.Env}:${observation.data.Name}`,
                    ],
                  ],
                },
              ],
              ComponentDecider_JobRunFinishedHandler
            ),
          },
        ],
      },
      {
        entity: ProviderFailure.ENTITY_NAME,
        type: ProviderFailure.TYPE,
        deciderCellsThatCareAboutMe: [
          {
            entity: JobRunFinished.ENTITY_NAME,
            type: JobRunFinished.TYPE,
            cell: new LambdaDeciderModuleInstance(
              ProviderFailure.ENTITY_NAME,
              ProviderFailure.TYPE,
              JobRunFinished.ENTITY_NAME,
              JobRunFinished.TYPE,
              [
                {
                  filter:
                    filters.TOP_10_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_GSI2_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    JobRun.ENTITY_NAME,
                    JobRun.TYPE,
                    (observation) => [observation.data.AWSResourceArn],
                  ],
                },
              ],
              JobRunFinishedDecider_ProviderFailureHandler
            ),
          },
        ],
      },
      {
        entity: RemoveComponentRequest.ENTITY_NAME,
        type: RemoveComponentRequest.TYPE,
        deciderCellsThatCareAboutMe: [
          {
            entity: Deployment.ENTITY_NAME,
            type: Deployment.TYPE,
            cell: new LambdaDeciderModuleInstance(
              RemoveComponentRequest.ENTITY_NAME,
              RemoveComponentRequest.TYPE,
              Deployment.ENTITY_NAME,
              Deployment.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Deployment.ENTITY_NAME,
                    Deployment.TYPE,
                    (observation) => observation.data.ComponentDeployments.map(lastComponentDeployment => lastComponentDeployment.LastDeploymentGuid),
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Policy.ENTITY_NAME,
                    Policy.TYPE,
                    (observation) => observation.data.PolicyNames,
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    DeploymentRequest.ENTITY_NAME,
                    DeploymentRequest.TYPE,
                    (observation) => observation.data.ComponentDeployments.map(lastComponentDeployment => lastComponentDeployment.LastDeploymentGuid),
                  ],
                },
              ],
              DeploymentDecider_RemoveComponentRequestHandler
            ),
          },
        ],
      },
      // {
      //   entity: JobRun.ENTITY_NAME,
      //   type: JobRun.TYPE
      // }
    ],
    externalEntities: [
      {
        entity: JobRunFinished.ENTITY_NAME,
        type: JobRunFinished.TYPE,
        observers: [
          {
            cell: new SnsTopicObserverModuleInstance(JobRunFinishedHandler),
            topicArnMatch: "job-run-finished",
          },
        ],
        deciderCellsThatCareAboutMe: [
          {
            entity: DeploymentUpdate.ENTITY_NAME,
            type: DeploymentUpdate.TYPE,
            cell: new LambdaDeciderModuleInstance(
              JobRun.ENTITY_NAME,
              JobRun.TYPE,
              DeploymentUpdate.ENTITY_NAME,
              DeploymentUpdate.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [JobRun.ENTITY_NAME, JobRun.TYPE],
                },
              ],
              DeploymentUpdateDecider_JobRunUpdateHandler,
              false
            ),
          },
        ],
      },
      {
        entity: ProviderFailure.ENTITY_NAME,
        type: ProviderFailure.TYPE,
        observers: [
          {
            cell: new EventBridgeObserverModuleInstance(ProviderFailureHandler),
            eventSourceMatch: "aws.codebuild",
          },
        ],
      },
      {
        entity: JobRunUpdate.ENTITY_NAME,
        type: JobRunUpdate.TYPE,
        observers: [
          {
            cell: new CloudWatchLogObserverModuleInstance(
              createGenericCloudWatchLogObserverHandle(
                JobRunUpdate.EntityObservation
              ),
              false
            ),
            logGroupMatch: "frankenstack-deployments",
          },
        ],
        deciderCellsThatCareAboutMe: [
          {
            entity: DeploymentUpdate.ENTITY_NAME,
            type: DeploymentUpdate.TYPE,
            cell: new LambdaDeciderModuleInstance(
              JobRun.ENTITY_NAME,
              JobRun.TYPE,
              DeploymentUpdate.ENTITY_NAME,
              DeploymentUpdate.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [JobRun.ENTITY_NAME, JobRun.TYPE],
                },
              ],
              DeploymentUpdateDecider_JobRunUpdateHandler,
              false
            ),
          },
        ],
      },
      {
        entity: DeploymentForm.ENTITY_NAME,
        type: DeploymentForm.TYPE,
        observers: [
          //TODO:
          {
            operation: "sendDeploymentForm",
            cell: new AppSyncRequestObserverModuleInstance(
              SendDeploymentFormHandler
            ),
          },
        ],
        deciderCellsThatCareAboutMe: [
          {
            entity: DeploymentRequest.ENTITY_NAME,
            type: DeploymentRequest.TYPE,
            cell: new LambdaDeciderModuleInstance(
              DeploymentForm.ENTITY_NAME,
              DeploymentForm.TYPE,
              DeploymentRequest.ENTITY_NAME,
              DeploymentRequest.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [
                    DeploymentRequest.ENTITY_NAME,
                    DeploymentRequest.TYPE,
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_DATA_PROPERTY,
                  filterValues: [User.ENTITY_NAME, User.TYPE, "User"],
                },
              ],
              DeploymentRequestDecider_DeploymentFormHandler
            ),
          },
        ],
      },
      {
        entity: PutUserMutation.ENTITY_NAME,
        type: PutUserMutation.TYPE,
        observers: [
          //TODO:
          {
            operation: "putUser",
            cell: new AppSyncRequestObserverModuleInstance(
              PutUserMutationHandler
            ),
          },
        ],
        deciderCellsThatCareAboutMe: [
          {
            entity: User.ENTITY_NAME,
            type: User.TYPE,
            cell: new LambdaDeciderModuleInstance(
              PutUserMutation.ENTITY_NAME,
              PutUserMutation.TYPE,
              User.ENTITY_NAME,
              User.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_DATA_PROPERTY,
                  filterValues: [
                    Deployment.ENTITY_NAME,
                    Deployment.TYPE,
                    "UserId",
                  ],
                },
              ],
              UserDecider_PutUserMutationHandler
            ),
          },
        ],
      },
      {
        entity: PutPolicyMutation.ENTITY_NAME,
        type: PutPolicyMutation.TYPE,
        observers: [
          //TODO:
          {
            operation: "putPolicy",
            cell: new AppSyncRequestObserverModuleInstance(
              PutPolicyMutationHandler
            ),
          },
        ],
        deciderCellsThatCareAboutMe: [
          {
            entity: Policy.ENTITY_NAME,
            type: User.TYPE,
            cell: new LambdaDeciderModuleInstance(
              PutPolicyMutation.ENTITY_NAME,
              PutPolicyMutation.TYPE,
              Policy.ENTITY_NAME,
              Policy.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_DATA_PROPERTY,
                  filterValues: [
                    Deployment.ENTITY_NAME,
                    Deployment.TYPE,
                    "PolicyName",
                  ],
                },
              ],
              PolicyDecider_PutPolicyMutationHandler
            ),
          },
        ],
      },
      {
        entity: JobRun.ENTITY_NAME,
        type: JobRun.TYPE,
        observers: [
          {
            actionName: "JobRunAction",
            cell: new CustomResponseObserverModuleInstance(
              JobRunResponseHandler
            ),
          },
        ],
        deciderCellsThatCareAboutMe: [
          {
            entity: DeploymentUpdate.ENTITY_NAME,
            type: DeploymentUpdate.TYPE,
            cell: new LambdaDeciderModuleInstance(
              JobRun.ENTITY_NAME,
              JobRun.TYPE,
              DeploymentUpdate.ENTITY_NAME,
              DeploymentUpdate.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [
                    DeploymentUpdate.ENTITY_NAME,
                    DeploymentUpdate.TYPE,
                  ],
                },
              ],
              DeploymentUpdateDecider_JobRunHandler,
              false
            ),
          },
          {
            entity: Deployment.ENTITY_NAME,
            type: Deployment.TYPE,
            cell: new LambdaDeciderModuleInstance(
              JobRun.ENTITY_NAME,
              JobRun.TYPE,
              Deployment.ENTITY_NAME,
              Deployment.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_DATA_PROPERTY,
                  filterValues: [
                    Deployment.ENTITY_NAME,
                    Deployment.TYPE,
                    "DeploymentGuid",
                  ],
                },
              ],
              DeploymentDecider_JobRunHandler,
              true
            ),
          },
        ],
      },
      {
        entity: RemoveComponentMutation.ENTITY_NAME,
        type: RemoveComponentMutation.TYPE,
        observers: [
          {
            module: "AppSyncRequestObserverModule",
            operation: "RemoveComponent",
            cell: new AppSyncRequestObserverModuleInstance(
              RemoveComponentMutationHandler
            ),
          },
        ],
        deciderCellsThatCareAboutMe: [
          {
            entity: RemoveComponentRequest.ENTITY_NAME,
            type: RemoveComponentRequest.TYPE,
            cell: new LambdaDeciderModuleInstance(
              RemoveComponentMutation.ENTITY_NAME,
              RemoveComponentMutation.TYPE,
              RemoveComponentRequest.ENTITY_NAME,
              RemoveComponentRequest.TYPE,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Component.ENTITY_NAME,
                    Component.TYPE,
                    (observation) => {
                      let componentNames: Array<string> = [];
                      if(observation.data.ComponentName) {
                        componentNames.push(observation.data.ComponentName);
                      }
                      if(observation.data.ComponentNames) {
                        componentNames.push(...observation.data.ComponentNames);
                      }
                      return componentNames.map(componenentName => `${observation.data.Env}:${componenentName}`)
                    },
                  ],
                },
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_DATA_PROPERTY,
                  filterValues: [User.ENTITY_NAME, User.TYPE, "User"],
                },
              ],
              RemoveComponentRequestDecider_RemoveComponentMutationHandler,
              true
            ),
          },
        ],
      },
      {
        entity: ComponentRollbackQuery.ENTITY_NAME,
        type: ComponentRollbackQuery.TYPE,
        observers: [
          {
            module: "AppSyncRequestObserverModule",
            operation: "getComponentRollbackState",
            cell: new AppSyncRequestObserverModuleInstance(
              ComponentRollbackQueryHandler
            ),
          },
        ],
        actorCellsThatCareAboutMe: [
          {
            name: "ComponentRollbackQueryResponseActor",
            module: APPSYNC_REQUEST_RESPONSE_ACTOR_MODULE,
            cell: new AppSyncRequestResponseActorModuleInstance(
              "ComponentRollbackQueryResponseActor",
              ComponentRollbackQueryResponseHandler,
              [
                {
                  filter:
                    filters.TOP_2_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [Component.ENTITY_NAME, Component.TYPE],
                },
                {
                  filter:
                    filters.TOP_10_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_GSI2_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    ComponentDeployment.ENTITY_NAME,
                    ComponentDeployment.TYPE,
                    (observation) => [
                      `${observation.data.Env}:${observation.data.ComponentName}`,
                    ],
                  ],
                },
              ]
            ),
          },
        ],
      },
      {
        entity: GetDeploymentRequestQuery.ENTITY_NAME,
        type: GetDeploymentRequestQuery.TYPE,
        observers: [
          {
            module: "AppSyncRequestObserverModule",
            operation: "getDeploymentRequest",
            cell: new AppSyncRequestObserverModuleInstance(
              GetDeploymentRequestQueryHandler
            ),
          },
        ],
        actorCellsThatCareAboutMe: [
          {
            name: "GetDeploymentRequestResponseActor",
            module: APPSYNC_REQUEST_RESPONSE_ACTOR_MODULE,
            cell: new AppSyncRequestResponseActorModuleInstance(
              "GetDeploymentRequestResponseActor",
              GetDeploymentRequestQueryResponseHandler,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [DeploymentRequest.ENTITY_NAME, DeploymentRequest.TYPE],
                }
              ]
            ),
          },
        ],
      },
      {
        entity: DescribeComponentQuery.ENTITY_NAME,
        type: DescribeComponentQuery.TYPE,
        observers: [
          {
            module: "AppSyncRequestObserverModule",
            operation: "describeComponent",
            cell: new AppSyncRequestObserverModuleInstance(
              DescribeComponentQueryHandler
            ),
          },
        ],
        actorCellsThatCareAboutMe: [
          {
            name: "DescribeComponentQueryHandlerActor",
            module: APPSYNC_REQUEST_RESPONSE_ACTOR_MODULE,
            cell: new AppSyncRequestResponseActorModuleInstance(
              "DescribeComponentQueryHandlerActor",
              DescribeComponentQueryResponseHandler,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID,
                  filterValues: [Component.ENTITY_NAME, Component.TYPE],
                },
                {
                  filter:
                    filters.TOP_10_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_GSI2_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    ComponentDeployment.ENTITY_NAME,
                    ComponentDeployment.TYPE,
                    (observation) => [
                      `${observation.data.Env}:${observation.data.ComponentName}`,
                    ],
                  ],
                },
              ]
            ),
          },
        ],
      },
      {
        entity: ResolvedInputsQuery.ENTITY_NAME,
        type: ResolvedInputsQuery.TYPE,
        observers: [
          {
            module: "AppSyncRequestObserverModule",
            operation: "getResolvedInputs",
            cell: new AppSyncRequestObserverModuleInstance(
              ResolvedInputsQueryHandler
            ),
          },
        ],
        actorCellsThatCareAboutMe: [
          {
            name: "ResolvedInputsQueryResponseActor",
            module: APPSYNC_REQUEST_RESPONSE_ACTOR_MODULE,
            cell: new AppSyncRequestResponseActorModuleInstance(
              "ResolvedInputsQueryResponseActor",
              ResolvedInputsQueryResponseHandler,
              [
                {
                  filter:
                    filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION,
                  filterValues: [
                    Component.ENTITY_NAME,
                    Component.TYPE,
                    (observation) => getComponentLookup(observation),
                  ],
                },
              ]
            ),
          },
        ],
      },
    ],
  };
  return template;
}
