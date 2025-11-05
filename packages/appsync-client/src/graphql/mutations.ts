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
  $componentName: String
  $jobRunGuid: String
  $status: String
) {
  deploymentUpdate(
    deploymentGuid: $deploymentGuid
    type: $type
    message: $message
    moreInfoComponentName: $moreInfoComponentName
    moreInfoKey: $moreInfoKey
    moreInfoType: $moreInfoType
    componentName: $componentName
    jobRunGuid: $jobRunGuid
    status: $status
  ) {
    deploymentGuid
    type
    message
    moreInfoComponentName
    moreInfoType
    moreInfoKey
    componentName
    jobRunGuid
    status
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
  $componentName: String
  $componentNames: [String]
) {
  RemoveComponent(
    deploymentGuid: $deploymentGuid
    env: $env
    componentName: $componentName
    componentNames: $componentNames
  )
}
`;
