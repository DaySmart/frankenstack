/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Template = {
  env: string,
  components: Array< InputComponent | null >,
};

export type InputComponent = {
  name: string,
  provider: ProviderInput,
  inputs?: Array< KeyValue | null > | null,
  outputs?: Array< KeyValue | null > | null,
};

export type ProviderInput = {
  name: string,
  config?: Array< KeyValue | null > | null,
};

export type KeyValue = {
  name?: string | null,
  value?: string | null,
};

export type SendDeploymentFormMutationVariables = {
  deploymentGuid: string,
  template: Template,
};

export type SendDeploymentFormMutation = {
  sendDeploymentForm: boolean | null,
};

export type GetDeploymentStatusQueryVariables = {
  deploymentGuid?: string | null,
};

export type GetDeploymentStatusQuery = {
  getDeploymentStatus:  {
    __typename: "DeploymentStatus",
    status: string | null,
  } | null,
};
