// tslint:disable
// this is an auto generated file. This will be overwritten

export const subscribeToDeploymentUpdate = `subscription SubscribeToDeploymentUpdate($deploymentGuid: ID!) {
  subscribeToDeploymentUpdate(deploymentGuid: $deploymentGuid) {
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
