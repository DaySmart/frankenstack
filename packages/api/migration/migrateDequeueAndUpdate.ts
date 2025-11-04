import aws from 'aws-sdk';
const docClient = new aws.DynamoDB.DocumentClient();
const dynamoDbTable = process.env.PLUGIN_TS_AWS_DYNAMODB_TABLE as string;

export async function migrateDequeueAndUpdate(event) {
	if (!event || !event.Records) {
		console.log('no event or event.Records found');
		return;
	}

	if (!event.Records.length) {
		console.log('empty records');
		return;
	}

	const { messageId, receiptHandle, body } = event.Records[0];
	const items = JSON.parse(body);
	console.log({messageId, receiptHandle, body});

	const updateItemPromises = items.map(item => {
		const [_guid, env, componentName] = item.entityid.split(':');
		const GSI2PK = `ET#${item.entity}#TY#${item.type}#D2#${env}:${componentName}`;
		const GSI2SK = item.GSI1SK;
		const params = {
			TableName: dynamoDbTable,
			Key: {
				PK: item.PK,
				SK: item.SK
			},
			UpdateExpression: 'set #gsi2pk = :gsi2pk, #gsi2sk = :gsi2sk',
			ExpressionAttributeNames: {
				'#gsi2pk': 'GSI2PK',
				'#gsi2sk': 'GSI2SK'
			},
			ExpressionAttributeValues: {
				':gsi2pk': GSI2PK,
				':gsi2sk': GSI2SK,
			}
		};
		console.log({item, params});
		return docClient.update(params).promise();
	});
	const dynamoResponses = await Promise.all(updateItemPromises);
	console.log({resp: JSON.stringify(dynamoResponses)});
}