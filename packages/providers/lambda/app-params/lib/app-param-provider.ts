import { SSM } from 'aws-sdk';
import { Provider } from "@daysmart/frankenstack-base-provider/assets/Provider";

export class AppParamsProvider extends Provider {
    async provisionComponent() {
        let client: SSM;
        if (this.region) {
            client = new SSM({
                region: this.region,
            })
        } else {
            client = new SSM();
        }

        if (this.awsCredentials){
            client.config.credentials = this.awsCredentials;
        }

        try {
            const paramName = `/${this.environment}/${this.componentName}`;
            const resp = await client.putParameter({
                Name: paramName,
                Value: JSON.stringify(Object.assign({}, ...this.inputs.map(input => {return {[input.Key]: input.Value}}))),
                Type: 'SecureString',
                Overwrite: true
            }).promise();

            console.log(resp);

            this.outputs.push({
                Key: 'APP_PARAMETERS',
                Value: paramName
            });

            this.result = true;
        } catch(err) {
            console.error(err);
        }
    }
}
