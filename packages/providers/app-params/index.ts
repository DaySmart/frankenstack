import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { ProviderProps, ProviderStack } from '@daysmart/frankenstack-base-provider';

export class AppParamsProvider extends ProviderStack {
    constructor(scope: cdk.Construct, id: string, props: ProviderProps) {
        super(scope, id, props);

        this.lambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ssm:PutParameter'],
            resources: ['*']
        }));
    }
}