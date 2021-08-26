import { CloudWatchLogs } from 'aws-sdk';

export class Logger {
    readonly logGroup: string;
    readonly logStream: string;
    readonly client: CloudWatchLogs
    private sequenceToken: string | undefined;

    constructor(logGroup: string, logStream: string) {
        this.logGroup = logGroup;
        this.logStream = logStream;
        this.client = new CloudWatchLogs();

        this.client.createLogStream({
            logGroupName: this.logGroup,
            logStreamName: this.logStream
        })
    }

    info(message: string) {
        console.log(message);

        this.client.putLogEvents({
            logGroupName: this.logGroup,
            logStreamName: this.logStream,
            logEvents: [{
                message: message,
                timestamp: Date.now()
            }],
            sequenceToken: this.sequenceToken
        }, (err, data) => {
            if(err) {
                console.error(err, err.stack);
            } else {
                this.sequenceToken = data.nextSequenceToken;
            }
        })
    }
}