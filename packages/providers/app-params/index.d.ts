import * as cdk from '@aws-cdk/core';
import { ProviderProps, ProviderStack } from '@daysmart/frankenstack-base-provider';
export declare class AppParamsProvider extends ProviderStack {
    constructor(scope: cdk.Construct, id: string, props: ProviderProps);
}
