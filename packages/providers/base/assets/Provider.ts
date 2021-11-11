import { SNS, SSM } from 'aws-sdk';
import { Logger } from './Logger';

export class Provider {
    public deploymentGuid: string;
    public environment: string;
    public componentName: string;
    public inputs: Array<{ Key: string, Value: string }>;
    public outputs: Array<{ Key: string, Value: string }>;
    public result: boolean;
    public jobRunGuid: string;
    public logGroup: string;
    public logger: Logger;
    sns = new SNS();
    ssm = new SSM();

    constructor(event: any) {
        this.deploymentGuid = event.deploymentGuid;
        this.environment = event.environment;
        this.componentName = event.componentName;
        this.jobRunGuid = event.jobRunGuid;
        this.inputs = event.inputs;
        this.logGroup = event.logGroup;
        this.outputs = [];
        this.logger = new Logger(this.logGroup, this.jobRunGuid);
        console.log(event);
    }

    async decryptInputs() {
        for (let i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].Value.startsWith('ssm:')) {
                const resp = await this.ssm.getParameter({
                    Name: this.inputs[i].Value.replace('ssm:', ''),
                    WithDecryption: true
                }).promise();

                if (resp.Parameter) {
                    this.inputs[i].Value = resp.Parameter.Value as string;
                } else {
                    this.result = false;
                    await this.sendResponse();
                    throw Error(`Could not find Specified Parameter => ${this.inputs[i].Value}`);
                }
            }
        }


    }

    async provisionComponent(): Promise<void> { }

    async sendResponse() {
        let resp = {
            deploymentGuid: this.deploymentGuid,
            env: this.environment,
            jobRunGuid: this.jobRunGuid,
            name: this.componentName,
            status: this.result ? 'Success' : 'Failed',
            outputs: JSON.stringify(this.outputs)
        }

        const respParams: SNS.PublishInput = {
            Message: JSON.stringify(resp),
            TopicArn: process.env.JOB_RUN_FINISHED_TOPIC_ARN
        }

        await this.sns.publish(respParams).promise();
    }

}