import { SNS, SSM } from 'aws-sdk';

export interface Provider {
    deploy(): Promise<void>
    remove(): Promise<void>
}

interface ProviderConfiguration {
    componentProvider: {
        name: string;
        config: Array<{key: string, value: string}>
        account?: {
            accountId: string;
            credentials: string;
        }
    };
    environment: string;
    componentName: string;
    deploymentGuid: string;
    jobRunGuid: string;
    jobRunFinishedTopicArn: string;
    inputs: Array<{key: string, value: string}>;
    stage?: string;
    region?: string;
}

export class BaseProvider implements Provider  {
    readonly config: ProviderConfiguration;
    public result: boolean = false;
    public outputs: Array<{Key: string, Value: string}> = [];

    private sns: SNS;
    private ssm: SSM;

    constructor(config: ProviderConfiguration) {
        this.config = config;
        this.sns = new SNS({region: this.config.region});
        this.ssm = new SSM({region: this.config.region});
    }

    deploy(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    remove(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async decryptInputs() {
        for (let i = 0; i < this.config.inputs.length; i++) {
            if (this.config.inputs[i].value.startsWith('ssm:')) {
                const resp = await this.ssm.getParameter({
                    Name: this.config.inputs[i].value.replace('ssm:', ''),
                    WithDecryption: true
                }).promise();

                if (resp.Parameter) {
                    this.config.inputs[i].value = resp.Parameter.Value as string;
                } else {
                    this.result = false;
                    await this.sendResponse();
                    throw Error(`Could not find Specified Parameter => ${this.config.inputs[i].value}`);
                }
            }
        }
    }

    async sendResponse() {
        let resp = {
            deploymentGuid: this.config.deploymentGuid,
            env: this.config.environment,
            jobRunGuid: this.config.jobRunGuid,
            name: this.config.componentName,
            status: this.result ? 'Success' : 'Failed',
            outputs: JSON.stringify(this.outputs)
        }

        const respParams: SNS.PublishInput = {
            Message: JSON.stringify(resp),
            TopicArn: this.config.jobRunFinishedTopicArn
        }

        await this.sns.publish(respParams).promise();
    }
}