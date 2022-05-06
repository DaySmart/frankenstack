import { SSM } from 'aws-sdk';
import { Provider } from '@daysmart/frankenstack-base-provider/assets/Provider';

export class AwsAccountProvider extends Provider {
    async provisionComponent() {
        let ssm = new SSM();

        let accountId = this.inputs.find(input => input.Key === 'accountId');
        if(accountId) {
            this.outputs.push({
                Key: accountId.Key,
                Value: accountId.Value
            });
        } else {
            console.log("Required property accountId was missing!")
            this.result = false;
            return
        }

        let credentials = this.inputs.reduce((obj: any, item) => {
            if(item.Key !== 'accountId') {
                obj[item.Key] = item.Value;
            }
            return obj;
        }, {});

        try {
            const ssmParamName = `/${this.environment}/${this.componentName}/credentials`
            const ssmResp = await ssm.putParameter({
                Name: ssmParamName,
                Value: JSON.stringify(credentials),
                Type: 'SecureString',
                Overwrite: true
            }).promise();

            console.log('SSM resp', ssmResp);

            this.outputs.push({
                Key: 'credentials',
                Value: `ssm:${ssmParamName}`
            });

            this.result = true;
        } catch(err) {
            console.error(err);
            this.result = false;
        }
    }
}