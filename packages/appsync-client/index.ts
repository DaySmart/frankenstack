import { sendDeploymentForm, deploymentUpdate, putPolicy, putUser, removeComponent } from './src/graphql/mutations';
import gql from 'graphql-tag';
import { subscribeToDeploymentUpdate } from './src/graphql/subscriptions';
import { Observable } from 'apollo-client/util/Observable'
import { DeploymentUpdateMutationVariables, InputComponent, PutPolicyMutationVariables, PutUserMutationVariables, RemoveComponentMutation, RemoveComponentMutationVariables, Template } from './src/graphql/types';
import { FetchResult } from 'apollo-link';
import { getComponentRollbackStateFull, describeComponentFull, getDeploymentRequestFull } from './src/graphql/customQueries';
import { getResolvedInputs } from './src/graphql/queries';
import { AuthOptions, AUTH_TYPE } from 'aws-appsync-auth-link';
import { AWSAppSyncClient } from 'aws-appsync'
const { AppSyncRealTimeSubscriptionHandshakeLink } = require('aws-appsync-subscription-link/lib/realtime-subscription-handshake-link');

export class EnvironmentServiceAppSyncClient {

    public client: AWSAppSyncClient<any>;

    constructor(awsconfig: any, awscreds: any) {

        const url = awsconfig.aws_appsync_graphqlEndpoint;
        const region = awsconfig.aws_appsync_region;
        const auth: AuthOptions = {
            type: AUTH_TYPE.AWS_IAM,
            credentials: awscreds
        }

        //Hack for https://github.com/awslabs/aws-mobile-appsync-sdk-js/issues/619
        const oldStartSubscription = AppSyncRealTimeSubscriptionHandshakeLink.prototype._startSubscriptionWithAWSAppSyncRealTime;
        AppSyncRealTimeSubscriptionHandshakeLink.prototype._startSubscriptionWithAWSAppSyncRealTime = function(a: any) {
            if (a.options) {
                delete a.options.graphql_headers;
            }
            return oldStartSubscription.call(this, a);
        };

        this.client = new AWSAppSyncClient({
            url,
            region,
            auth,
            disableOffline: true
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

    async getDeploymentRequest(deploymentGuid: string): Promise<FetchResult> {
        return await this.client.query({
            query: gql(getDeploymentRequestFull),
            variables: {
                deploymentGuid: deploymentGuid
            }
        });
    }

    async describeComponent(environment: string, componentName: string): Promise<FetchResult> {
        return await this.client.query({
            query: gql(describeComponentFull),
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

    async removeComponent(mutation: RemoveComponentMutationVariables): Promise<FetchResult> {
        return await this.client.mutate({
            mutation: gql(removeComponent),
            variables: mutation
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