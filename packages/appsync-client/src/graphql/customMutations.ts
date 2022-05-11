export const jobRunRequestFull = `mutation JobRunRequest(
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
      component {
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
      }
    }
  }
  `;