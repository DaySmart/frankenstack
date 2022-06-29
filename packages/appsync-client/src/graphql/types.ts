/* tslint:disable */
//  This file was automatically generated and should not be edited.

export type InputComponent = {
  name: string,
  provider: ProviderInput,
  inputs?: Array< KeyValueInput | null > | null,
  outputs?: Array< KeyValueInput | null > | null,
};

export type ProviderInput = {
  name: string,
  config?: Array< KeyValueInput | null > | null,
};

export type KeyValueInput = {
  name?: string | null,
  value?: string | null,
};

export type Template = {
  env: string,
  components: Array< InputComponent | null >,
};

export type Statement = {
  effect: Effect,
  actions: Array< string | null >,
  resources: Array< string | null >,
};

export enum Effect {
  Allow = "Allow",
  Deny = "Deny",
}


export type GetDeploymentStatusQueryVariables = {
  deploymentGuid?: string | null,
};

export type GetDeploymentStatusQuery = {
  getDeploymentStatus:  {
    __typename: "DeploymentStatus",
    status: string | null,
  } | null,
};

export type GetComponentRollbackStateQueryVariables = {
  env: string,
  componentName: string,
};

export type GetComponentRollbackStateQuery = {
  getComponentRollbackState:  {
    __typename: "ComponentDeployment",
    deploymentGuid: string,
    env: string,
    name: string,
    provider:  {
      __typename: "Provider",
      name: string,
      config:  Array< {
        __typename: "KeyValue",
        name: string,
        value: string,
      } | null > | null,
    },
    inputs:  Array< {
      __typename: "KeyValue",
      name: string,
      value: string,
    } | null > | null,
    outputs:  Array< {
      __typename: "KeyValue",
      name: string,
      value: string,
    } | null > | null,
  } | null,
};

export type GetDeploymentRequestQueryVariables = {
  deploymentGuid: string,
};

export type GetDeploymentRequestQuery = {
  getDeploymentRequest:  {
    __typename: "DeploymentRequest",
    env: string,
    user: string | null,
    policyNames: Array< string | null > | null,
    components:  Array< {
      __typename: "RequestedComponent",
      name: string,
      provider:  {
        __typename: "Provider",
        name: string,
      },
      inputs:  Array< {
        __typename: "KeyValue",
        name: string,
        value: string,
      } | null > | null,
      outputs:  Array< {
        __typename: "KeyValue",
        name: string,
        value: string,
      } | null > | null,
    } | null >,
  } | null,
};

export type GetResolvedInputsQueryVariables = {
  env: string,
  component: InputComponent,
};

export type GetResolvedInputsQuery = {
  getResolvedInputs:  Array< {
    __typename: "KeyValue",
    name: string,
    value: string,
  } | null > | null,
};

export type DescribeComponentQueryVariables = {
  env: string,
  componentName: string,
};

export type DescribeComponentQuery = {
  describeComponent:  {
    __typename: "Component",
    deploymentGuid: string,
    env: string,
    name: string,
    inputs:  Array< {
      __typename: "KeyValue",
      name: string,
      value: string,
    } | null > | null,
    outputs:  Array< {
      __typename: "KeyValue",
      name: string,
      value: string,
    } | null > | null,
    status: string,
    create: string,
    update: string,
  } | null,
};

export type SendDeploymentFormMutationVariables = {
  deploymentGuid: string,
  template: Template,
};

export type SendDeploymentFormMutation = {
  sendDeploymentForm: boolean | null,
};

export type DeploymentUpdateMutationVariables = {
  deploymentGuid: string,
  type: string,
  message: string,
  moreInfoComponentName?: string | null,
  moreInfoKey?: string | null,
  moreInfoType?: string | null,
};

export type DeploymentUpdateMutation = {
  deploymentUpdate:  {
    __typename: "DeploymentUpdate",
    deploymentGuid: string,
    type: string,
    message: string,
    moreInfoComponentName: string | null,
    moreInfoType: string | null,
    moreInfoKey: string | null,
  } | null,
};

export type PutUserMutationVariables = {
  userId: string,
  email?: string | null,
  policies?: Array< string | null > | null,
};

export type PutUserMutation = {
  putUser: boolean,
};

export type PutPolicyMutationVariables = {
  policyName: string,
  statements: Array< Statement | null >,
};

export type PutPolicyMutation = {
  putPolicy: boolean,
};

export type RemoveComponentMutationVariables = {
  deploymentGuid: string,
  env: string,
  componentName?: string | null,
  componentNames?: Array< string | null > | null,
};

export type RemoveComponentMutation = {
  RemoveComponent: boolean | null,
};

export type SubscribeToDeploymentUpdateSubscriptionVariables = {
  deploymentGuid: string,
};

export type SubscribeToDeploymentUpdateSubscription = {
  subscribeToDeploymentUpdate:  {
    __typename: "DeploymentUpdate",
    deploymentGuid: string,
    type: string,
    message: string,
    moreInfoComponentName: string | null,
    moreInfoType: string | null,
    moreInfoKey: string | null,
  } | null,
};
