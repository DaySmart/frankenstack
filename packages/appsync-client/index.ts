// import Amplify from 'aws-amplify';
// import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { sendDeploymentForm, deploymentUpdate, putPolicy, putUser } from './src/graphql/mutations';
import gql from 'graphql-tag';
import { subscribeToDeploymentUpdate } from './src/graphql/subscriptions';
import { Observable } from '@apollo/client/core'
import { DeploymentUpdateMutationVariables, InputComponent, PutPolicyMutationVariables, PutUserMutationVariables, Template } from './src/graphql/types';
import { FetchResult } from 'apollo-link';
import { getComponentRollbackStateFull } from './src/graphql/customQueries';
import { getResolvedInputs } from './src/graphql/queries';
import { AuthOptions, AUTH_TYPE, createAuthLink } from 'aws-appsync-auth-link';
import { createSubscriptionHandshakeLink } from 'aws-appsync-subscription-link';
import { HttpLink, createHttpLink } from '@apollo/client/link/http';
import { ApolloClient } from '@apollo/client/core'
import { InMemoryCache } from '@apollo/client/core';
// require('isomorphic-fetch');

export class EnvironmentServiceAppSyncClient {
    public client: ApolloClient<any>;

    constructor(awsconfig: any, awscreds: any) {
        // Amplify.configure(awsconfig);
        const url = awsconfig.aws_appsync_graphqlEndpoint;
        const region = awsconfig.aws_appsync_region;
        const auth: AuthOptions = {
            type: AUTH_TYPE.AWS_IAM,
            credentials: awscreds
        }

        const httpLink = createHttpLink({ uri: url });

        const link = HttpLink.from([
            createAuthLink({ url, region, auth }),
            createSubscriptionHandshakeLink(url, httpLink)
        ]);
          
        this.client = new ApolloClient({
            link,
            cache: new InMemoryCache()
        });
    }

    async sendDeploymentForm(deploymentGuid: string, deploymentForm: Template): Promise<FetchResult> {
        return await this.client.mutate({
            mutation: gql(sendDeploymentForm),
            variables: {
                deploymentGuid: deploymentGuid,
                template: deploymentForm
            }
        });
    }

    async getComponentRollback(environment: string, componentName: string): Promise<FetchResult> {
        return await this.client.query({
            query: gql(getComponentRollbackStateFull),
            variables: {
                env: environment,
                componentName: componentName
            }
        });
    }

    async deploymentUpdate(deploymentUpdateMutation: DeploymentUpdateMutationVariables): Promise<FetchResult> {
        return await this.client.mutate({
            mutation: gql(deploymentUpdate),
            variables: deploymentUpdateMutation
        });
    }

    async getResolvedInputs(environment: string, component: InputComponent): Promise<FetchResult> {
        return await this.client.query({
            query: gql(getResolvedInputs),
            variables: {
                env: environment,
                component: component
            }
        })
    }

    async putPolicy(policy: PutPolicyMutationVariables): Promise<FetchResult> {
        return await this.client.mutate({
            mutation: gql(putPolicy),
            variables: policy
        })
    }

    async putUser(user: PutUserMutationVariables): Promise<FetchResult> {
        return await this.client.mutate({
            mutation: gql(putUser),
            variables: user
        });
    }

    subscribeToDeploymentUpdate(deploymentGuid: string): Observable<any> {
        return this.client.subscribe({
            query: gql(subscribeToDeploymentUpdate),
            variables: {
                deploymentGuid: deploymentGuid
            }
        });
    }
}