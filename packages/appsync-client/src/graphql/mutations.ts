// tslint:disable
// this is an auto generated file. This will be overwritten

export const sendDeploymentForm = `mutation SendDeploymentForm($deploymentGuid: ID!, $template: Template!) {
  sendDeploymentForm(deploymentGuid: $deploymentGuid, template: $template)
}
`;
export const deploymentUpdate = `mutation DeploymentUpdate(
  $deploymentGuid: ID!
  $type: String!
  $message: String!
  $moreInfoComponentName: String
  $moreInfoKey: String
  $moreInfoType: String
) {
  deploymentUpdate(
    deploymentGuid: $deploymentGuid
    type: $type
    message: $message
    moreInfoComponentName: $moreInfoComponentName
    moreInfoKey: $moreInfoKey
    moreInfoType: $moreInfoType
  ) {
    deploymentGuid
    type
    message
    moreInfoComponentName
    moreInfoType
    moreInfoKey
  }
}
`;
export const putUser = `mutation PutUser($userId: String!, $email: String, $policies: [String]) {
  putUser(userId: $userId, email: $email, policies: $policies)
}
`;
export const putPolicy = `mutation PutPolicy($policyName: String!, $statements: [Statement]!) {
  putPolicy(policyName: $policyName, statements: $statements)
}
`;
export const removeComponent = `mutation RemoveComponent(
  $deploymentGuid: ID!
  $env: String!
  $componentName: String!
) {
  RemoveComponent(
    deploymentGuid: $deploymentGuid
    env: $env
    componentName: $componentName
  )
}
`;
export const jobRunRequest = `mutation JobRunRequest(
  $deploymentGuid: ID!
  $jobRunGuid: String!
  $env: String!
  $component: InputComponent!
) {
  jobRunRequest(
    deploymentGuid: $deploymentGuid
    jobRunGuid: $jobRunGuid
    env: $env
    component: $component
  ) {
    deploymentGuid
    jobRunGuid
    env
  }
}
`;
export const jobRunFinished = `mutation JobRunFinished(
  $deploymentGuid: String!
  $jobRunGuid: ID!
  $env: String!
  $componentName: String!
  $outputs: [KeyValueInput]
  $status: DeploymentResult
) {
  jobRunFinished(
    deploymentGuid: $deploymentGuid
    jobRunGuid: $jobRunGuid
    env: $env
    componentName: $componentName
    outputs: $outputs
    status: $status
  )
}
`;
