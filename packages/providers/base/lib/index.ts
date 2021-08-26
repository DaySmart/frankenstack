import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
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

enum ProviderCompute {
  LAMBDA = "LAMBDA",
  CODEBUILD = "CODEBUILD",
}

export class ProviderStack extends cdk.Construct {
  public lambda: NodejsFunction;

  constructor(scope: cdk.Construct, id: string, props: ProviderProps) {
    super(scope, id);

    if (props.compute === ProviderCompute.LAMBDA) {
      this.lambda = new NodejsFunction(this, props.providerName, {
        ...props.functionProps,
        entry: props.entry,
        handler: props.handler,
        environment: {
          ...props.functionProps?.environment,
          JOB_RUN_FINISHED_TOPIC_ARN: process.env
            .JOB_RUN_FINISHED_TOPIC_ARN as string,
        }
      });

      this.lambda.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [process.env.JOB_RUN_FINISHED_TOPIC_ARN as string]
      }));

      this.lambda.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: ['*']
      }));
      
      const output = new cdk.CfnOutput(this, "ResourceArnOutput", {
        value: this.lambda.functionArn,
        description: "The resource ARN of the provider lambda function",
      });
      output.overrideLogicalId("ResourceArn");
    }
  }
}
