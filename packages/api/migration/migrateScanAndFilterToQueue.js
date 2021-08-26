// manually run on dev's computer to add messages to queue

//PARAMETERS
const tableName = 'frankenstack-ethan'
const queueUrl = ""
/////////////////////

const aws = require("aws-sdk");
const documentClient = new aws.DynamoDB.DocumentClient();
const sqs = new aws.SQS();

async function migrateScanAndFilterToQueue() {
    const params = {
        TableName: tableName,
    };

    let response;
    do {
        response = await documentClient.scan(params).promise();
        const items = response.Items.filter(item => item.entity === 'daysmart.environmentservice.api.componentdeployment');

        const chunksize = 10;
        const chunks = [];
        while (items.length) {
            const chunk = items.splice(0,chunksize);
            chunks.push(chunk);
        }

        const sqsPromises = chunks.map(chunk => {
            const params = {
                QueueUrl: queueUrl,
                Entries: chunk.map((item) => {
                    return {
                        Id: item.traceid,
                        MessageBody: JSON.stringify(chunk)
                    }
                })
            };
            return sqs.sendMessageBatch(params).promise();
        })

        while (sqsPromises.length) {
            const waveOfSqsCalls = sqsPromises.splice(0, 3);
            const waveResponse = await Promise.all(waveOfSqsCalls);
            console.log({failures: waveResponse.map(r => r.Failures)});
        }

        params.ExclusiveStartKey = response.LastEvaluatedKey;
    } while (typeof response.LastEvaluatedKey !== "undefined");

};
migrateScanAndFilterToQueue();