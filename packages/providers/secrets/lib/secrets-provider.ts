import { SSM } from 'aws-sdk';
import { Provider } from "@daysmart/frankenstack-base-provider/assets/Provider";

export class SecretsProvider extends Provider {
    async provisionComponent() {
        let client = new SSM();
        
        try {
            for(var input of this.inputs) {
                console.log(input);
                const paramName = `/${this.environment}/${this.componentName}/${input.Key}`;
                const resp = await client.putParameter({
                    Name: paramName,
                    Value: input.Value,
                    Type: 'SecureString',
                    Overwrite: true
                }).promise();
    
                console.log(resp);
                this.outputs.push({
                    Key: input.Key,
                    Value: `ssm:${paramName}`
                });
                console.log(this.outputs);
            }
    
            const allInputsParamName = `/${this.environment}/${this.componentName}`;
            const allResp = await client.putParameter({
                Name: allInputsParamName,
                Value: JSON.stringify(Object.assign({}, ...this.inputs.map(input => {return {[input.Key]: input.Value}}))),
                Type: 'SecureString',
                Overwrite: true
            }).promise();
    
            console.log(allResp);

            this.result = true;
        } catch(err) {
            console.error(err);
        }
    }
}