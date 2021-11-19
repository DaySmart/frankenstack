import { SNS, SSM, Credentials, CredentialProviderChain } from 'aws-sdk';
import { Logger } from './Logger';

interface Account {
    accountId: string;
    credentials: string;
}

export class Provider {
    public deploymentGuid: string;
    public environment: string;
    public componentName: string;
	public config: Array<{ Key: string, Value: string }>;
    public inputs: Array<{ Key: string, Value: string }>;
    public outputs: Array<{ Key: string, Value: string }>;
    public result: boolean;
    public jobRunGuid: string;
    public logGroup: string;
    public logger: Logger;
    public account: Account;

	public awsCredentials: Credentials;
	public region: string;

    sns = new SNS();
    ssm = new SSM();

    constructor(event: any) {
        this.deploymentGuid = event.deploymentGuid;
        this.environment = event.environment;
        this.componentName = event.componentName;
        this.jobRunGuid = event.jobRunGuid;
        this.inputs = event.inputs;
        this.logGroup = event.logGroup;
		this.config = event.componentProvider.Config;
        this.account = event.componentProvider.Account;
        this.outputs = [];
        this.logger = new Logger(this.logGroup, this.jobRunGuid);
    }

    async setAwsAccountCredentials() {
		if (this.account && this.account.accountId && this.account.credentials) {
			console.log('getAwsAccountCredentials Account config found. Grabbing parameter store entry', { account: this.account });
			const ssm = new SSM();
			const param = await ssm.getParameter({
				Name: this.account.credentials.replace('ssm:', ''),
				WithDecryption: true
			}).promise();

			if (param && param.Parameter && param.Parameter.Value) {
				const parsedParam = JSON.parse(param.Parameter.Value);
				console.log('getAwsAccountCredentials Access Key ID from Parameter', { AWS_ACCESS_KEY_ID: parsedParam.AWS_ACCESS_KEY_ID });

				this.awsCredentials = new Credentials({
                    accessKeyId: parsedParam.AWS_ACCESS_KEY_ID,
                    secretAccessKey: parsedParam.AWS_SECRET_ACCESS_KEY
                });
			}
		}

		const regionConfig = this.config.find(c => c.Key === 'region');
		if (regionConfig) {
			this.region = regionConfig.Value;
		}
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
