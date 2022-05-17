// tslint:disable
// this is an auto generated file. This will be overwritten

export const getDeploymentStatus = `query GetDeploymentStatus($deploymentGuid: ID) {
  getDeploymentStatus(deploymentGuid: $deploymentGuid) {
    status
  }
}
`;
export const getComponentRollbackState = `query GetComponentRollbackState($env: String!, $componentName: String!) {
  getComponentRollbackState(env: $env, componentName: $componentName) {
    deploymentGuid
    env
    name
  }
}
`;
export const getDeploymentRequest = `query GetDeploymentRequest($deploymentGuid: ID!) {
  getDeploymentRequest(deploymentGuid: $deploymentGuid) {
    env
    user
    policyNames
  }
}
`;
export const getResolvedInputs = `query GetResolvedInputs($env: String!, $component: InputComponent!) {
  getResolvedInputs(env: $env, component: $component) {
    name
    value
  }
}
`;
export const describeComponent = `query DescribeComponent($env: String!, $componentName: String!) {
  describeComponent(env: $env, componentName: $componentName) {
    deploymentGuid
    env
    name
    status
    create
    update
  }
}
`;
