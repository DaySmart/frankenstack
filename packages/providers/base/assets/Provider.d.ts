import { SNS, SSM } from 'aws-sdk';
import { Logger } from './Logger';
export declare class Provider {
    deploymentGuid: string;
    environment: string;
    componentName: string;
    inputs: Array<{
        Key: string;
        Value: string;
    }>;
    outputs: Array<{
        Key: string;
        Value: string;
    }>;
    result: boolean;
    jobRunGuid: string;
    logGroup: string;
    logger: Logger;
    sns: SNS;
    ssm: SSM;
    constructor(event: any);
    decryptInputs(): Promise<void>;
    provisionComponent(): Promise<void>;
    sendResponse(): Promise<void>;
}
