// tslint:disable

export const getComponentRollbackStateFull = `query GetComponentRollbackState($env: String!, $componentName: String!) {
    getComponentRollbackState(env: $env, componentName: $componentName) {
      deploymentGuid
      env
      name
      provider {
          name
          config {
              name
              value
          }
      }
      inputs {
          name
          value
      }
      outputs {
          name
          value
      }
    }
  }
  `;

export const describeComponentFull = `query DescribeComponent($env: String!, $componentName: String!) {
    describeComponent(env: $env, componentName: $componentName) {
      deploymentGuid
      env
      name
      status
      create
      update
      outputs {
        name
        value
      }
      inputs {
          name
          value
      }
    }
  }
  `;