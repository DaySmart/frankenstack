export const subscribeToJobRunRequestsFull = `subscription SubscribeToJobRunRequests($deploymentGuid: ID!) {
    subscribeToJobRunRequests(deploymentGuid: $deploymentGuid) {
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