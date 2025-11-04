import { SSM } from 'aws-sdk';

const ssm = new SSM({region: 'us-east-1'});

module.exports = async (stage?: string) => {
    const paramStage = stage ? stage : 'prod';
    const param = await ssm.getParameter({
        Name: `${paramStage}-frankenstack-amplify-config`,
        WithDecryption: true
    }).promise();
    if(param.Parameter?.Value) {
        return JSON.parse(param.Parameter.Value);
    } else {
        throw `No configuration exists from ${paramStage}`;
    }
}