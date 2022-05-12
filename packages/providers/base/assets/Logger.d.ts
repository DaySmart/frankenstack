import { CloudWatchLogs } from 'aws-sdk';
export declare class Logger {
    readonly logGroup: string;
    readonly logStream: string;
    readonly client: CloudWatchLogs;
    private sequenceToken;
    constructor(logGroup: string, logStream: string);
    info(message: string): void;
}
