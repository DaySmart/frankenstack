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