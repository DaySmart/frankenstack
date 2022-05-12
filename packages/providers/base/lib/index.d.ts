import * as cdk from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { NodejsFunctionProps } from "@aws-cdk/aws-lambda-nodejs/lib/function";
export interface ProviderProps {
    providerName: string;
    compute: ProviderCompute;
    handler: string;
    version?: string;
    functionProps?: NodejsFunctionProps;
    entry: string;
}
declare enum ProviderCompute {
    LAMBDA = "LAMBDA",
    CODEBUILD = "CODEBUILD"
}
export declare class ProviderStack extends cdk.Construct {
    lambda: NodejsFunction;
    constructor(scope: cdk.Construct, id: string, props: ProviderProps);
}
export {};
