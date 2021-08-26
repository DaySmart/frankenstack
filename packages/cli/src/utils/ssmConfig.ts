import { SSM } from 'aws-sdk';

module.exports = async (creds: any, stage?: string) => {
    const ssm = new SSM({region: 'us-east-1', credentials: creds});
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