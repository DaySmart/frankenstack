"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderStack = void 0;
const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");
const aws_lambda_nodejs_1 = require("@aws-cdk/aws-lambda-nodejs");
var ProviderCompute;
(function (ProviderCompute) {
    ProviderCompute["LAMBDA"] = "LAMBDA";
    ProviderCompute["CODEBUILD"] = "CODEBUILD";
})(ProviderCompute || (ProviderCompute = {}));
class ProviderStack extends cdk.Construct {
    constructor(scope, id, props) {
        var _a;
        super(scope, id);
        if (props.compute === ProviderCompute.LAMBDA) {
            this.lambda = new aws_lambda_nodejs_1.NodejsFunction(this, props.providerName, {
                ...props.functionProps,
                entry: props.entry,
                handler: props.handler,
                environment: {
                    ...(_a = props.functionProps) === null || _a === void 0 ? void 0 : _a.environment,
                    JOB_RUN_FINISHED_TOPIC_ARN: process.env
                        .JOB_RUN_FINISHED_TOPIC_ARN,
                }
            });
            this.lambda.addToRolePolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sns:Publish'],
                resources: [process.env.JOB_RUN_FINISHED_TOPIC_ARN]
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
exports.ProviderStack = ProviderStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBcUM7QUFDckMsd0NBQXdDO0FBQ3hDLGtFQUE0RDtBQVk1RCxJQUFLLGVBR0o7QUFIRCxXQUFLLGVBQWU7SUFDbEIsb0NBQWlCLENBQUE7SUFDakIsMENBQXVCLENBQUE7QUFDekIsQ0FBQyxFQUhJLGVBQWUsS0FBZixlQUFlLFFBR25CO0FBRUQsTUFBYSxhQUFjLFNBQVEsR0FBRyxDQUFDLFNBQVM7SUFHOUMsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFvQjs7UUFDaEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssZUFBZSxDQUFDLE1BQU0sRUFBRTtZQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksa0NBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFlBQVksRUFBRTtnQkFDekQsR0FBRyxLQUFLLENBQUMsYUFBYTtnQkFDdEIsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO2dCQUNsQixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3RCLFdBQVcsRUFBRTtvQkFDWCxTQUFHLEtBQUssQ0FBQyxhQUFhLDBDQUFFLFdBQVc7b0JBQ25DLDBCQUEwQixFQUFFLE9BQU8sQ0FBQyxHQUFHO3lCQUNwQywwQkFBb0M7aUJBQ3hDO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO2dCQUNsRCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO2dCQUN4QixPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUM7Z0JBQ3hCLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQW9DLENBQUM7YUFDOUQsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7Z0JBQ2xELE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7Z0JBQ3hCLE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDO2dCQUM3QixTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7YUFDakIsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO2dCQUMxRCxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXO2dCQUM5QixXQUFXLEVBQUUsa0RBQWtEO2FBQ2hFLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUN6QztJQUNILENBQUM7Q0FDRjtBQXJDRCxzQ0FxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcIkBhd3MtY2RrL2NvcmVcIjtcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJAYXdzLWNkay9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IE5vZGVqc0Z1bmN0aW9uIH0gZnJvbSBcIkBhd3MtY2RrL2F3cy1sYW1iZGEtbm9kZWpzXCI7XHJcbmltcG9ydCB7IE5vZGVqc0Z1bmN0aW9uUHJvcHMgfSBmcm9tIFwiQGF3cy1jZGsvYXdzLWxhbWJkYS1ub2RlanMvbGliL2Z1bmN0aW9uXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFByb3ZpZGVyUHJvcHMge1xyXG4gIHByb3ZpZGVyTmFtZTogc3RyaW5nO1xyXG4gIGNvbXB1dGU6IFByb3ZpZGVyQ29tcHV0ZTtcclxuICBoYW5kbGVyOiBzdHJpbmc7XHJcbiAgdmVyc2lvbj86IHN0cmluZztcclxuICBmdW5jdGlvblByb3BzPzogTm9kZWpzRnVuY3Rpb25Qcm9wcztcclxuICBlbnRyeTogc3RyaW5nO1xyXG59XHJcblxyXG5lbnVtIFByb3ZpZGVyQ29tcHV0ZSB7XHJcbiAgTEFNQkRBID0gXCJMQU1CREFcIixcclxuICBDT0RFQlVJTEQgPSBcIkNPREVCVUlMRFwiLFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHJvdmlkZXJTdGFjayBleHRlbmRzIGNkay5Db25zdHJ1Y3Qge1xyXG4gIHB1YmxpYyBsYW1iZGE6IE5vZGVqc0Z1bmN0aW9uO1xyXG5cclxuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFByb3ZpZGVyUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCk7XHJcblxyXG4gICAgaWYgKHByb3BzLmNvbXB1dGUgPT09IFByb3ZpZGVyQ29tcHV0ZS5MQU1CREEpIHtcclxuICAgICAgdGhpcy5sYW1iZGEgPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgcHJvcHMucHJvdmlkZXJOYW1lLCB7XHJcbiAgICAgICAgLi4ucHJvcHMuZnVuY3Rpb25Qcm9wcyxcclxuICAgICAgICBlbnRyeTogcHJvcHMuZW50cnksXHJcbiAgICAgICAgaGFuZGxlcjogcHJvcHMuaGFuZGxlcixcclxuICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgLi4ucHJvcHMuZnVuY3Rpb25Qcm9wcz8uZW52aXJvbm1lbnQsXHJcbiAgICAgICAgICBKT0JfUlVOX0ZJTklTSEVEX1RPUElDX0FSTjogcHJvY2Vzcy5lbnZcclxuICAgICAgICAgICAgLkpPQl9SVU5fRklOSVNIRURfVE9QSUNfQVJOIGFzIHN0cmluZyxcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5sYW1iZGEuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgYWN0aW9uczogWydzbnM6UHVibGlzaCddLFxyXG4gICAgICAgIHJlc291cmNlczogW3Byb2Nlc3MuZW52LkpPQl9SVU5fRklOSVNIRURfVE9QSUNfQVJOIGFzIHN0cmluZ11cclxuICAgICAgfSkpO1xyXG5cclxuICAgICAgdGhpcy5sYW1iZGEuYWRkVG9Sb2xlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgYWN0aW9uczogWydzc206R2V0UGFyYW1ldGVyJ10sXHJcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXVxyXG4gICAgICB9KSk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zdCBvdXRwdXQgPSBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIlJlc291cmNlQXJuT3V0cHV0XCIsIHtcclxuICAgICAgICB2YWx1ZTogdGhpcy5sYW1iZGEuZnVuY3Rpb25Bcm4sXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIHJlc291cmNlIEFSTiBvZiB0aGUgcHJvdmlkZXIgbGFtYmRhIGZ1bmN0aW9uXCIsXHJcbiAgICAgIH0pO1xyXG4gICAgICBvdXRwdXQub3ZlcnJpZGVMb2dpY2FsSWQoXCJSZXNvdXJjZUFyblwiKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19