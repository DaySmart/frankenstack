import aws from "aws-sdk";
import { filters, Logger, Query, Repository, ObservationFilterFunction } from "o18k-ts-aws";
export { Repository } from "o18k-ts-aws";
import { ComponentDeployment } from "../../generated/Entities/ComponentDeployment";
import { IEntityObservation } from "../../generated/Entities/IEntityObservation";
import { JobRun } from "../../generated/Entities/JobRun";
const docClient = new aws.DynamoDB.DocumentClient();
const dynamoDbTable = process.env.PLUGIN_TS_AWS_DYNAMODB_TABLE as string;

import { Observation2 } from "../../generated/Observation2";

// export enum filters {
//   TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
//   TOP_1_WHERE_ENTITY_EQUALS_AND_ENTITYID_IN_LIST,
//   TOP_2_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS,
// }

// export interface Repository {
//   load(previousObservations: { filter: filters; filterValues: string[] }[]): Promise<Observation2<IEntityObservation>[][]>;

//   save(observations: Observation2<IEntityObservation>[]): void;
// }

export class DynamoDbRepository implements Repository {
  constructor(public logger: Logger) {}
  public async load(observation: Observation2<IEntityObservation>, previousObservations: Query[]): Promise<Observation2<IEntityObservation>[][]> {
    var queryParams: any;
    let observationLists = new Array<Array<Observation2<IEntityObservation>>>();

    for (let i = 0; i < previousObservations.length; i++) {
      const filterName = `${previousObservations[i].filter}:${previousObservations[i].filterValues.join(":")}`;
      console.log({ filter: previousObservations[i] });
      if (previousObservations[i].filter === filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_VALUE) {
        let GSI1PK = `ET#${previousObservations[i].filterValues[0]}#TY#${previousObservations[i].filterValues[1]}#EI#${previousObservations[i].filterValues[2]}`;

        queryParams = [
          {
            TableName: dynamoDbTable,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :GSI1PK",
            ExpressionAttributeValues: {
              ":GSI1PK": GSI1PK,
            },
            ScanIndexForward: false,
            Limit: 1,
          },
        ];
      } else if (previousObservations[i].filter === filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID) {
        let GSI1PK = `ET#${previousObservations[i].filterValues[0]}#TY#${previousObservations[i].filterValues[1]}#EI#${observation.entityid}`;

        queryParams = [
          {
            TableName: dynamoDbTable,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :GSI1PK",
            ExpressionAttributeValues: {
              ":GSI1PK": GSI1PK,
            },
            ScanIndexForward: false,
            Limit: 1,
          },
        ];
      } else if (previousObservations[i].filter === filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_IN_LIST_FROM_FUNCTION) {
        this.logger.Log(`[DynamoDBRepository.load.previousObservations] ${filterName}`, {
          previousObservation: previousObservations[i],
          observation,
        });
        let observationFilterValues = previousObservations[i].filterValues;
        console.log({ observationFilterValues });
        const observationFilterFunction = observationFilterValues[2] as ObservationFilterFunction;
        console.log({ observationFilterFunction });
        const entityIdsForQuery = observationFilterFunction(observation) || [];
        this.logger.Log(`[DynamoDBRepository.load.entityIdsForQuery] ${filterName}`, { previousObservation: previousObservations[i], observation, entityIdsForQuery });

        queryParams = entityIdsForQuery.map((value) => {
          return {
            TableName: dynamoDbTable,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :GSI1PK",
            ExpressionAttributeValues: {
              ":GSI1PK": `ET#${observationFilterValues[0]}#TY#${observationFilterValues[1]}#EI#${value}`,
            },
            ScanIndexForward: false,
            Limit: 1,
          };
        });
      } else if (previousObservations[i].filter === filters.TOP_1_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_DATA_PROPERTY) {
        const observationDataProperty = previousObservations[i].filterValues[2] as string;
        let GSI1PK = `ET#${previousObservations[i].filterValues[0]}#TY#${previousObservations[i].filterValues[1]}#EI#${observation.data[observationDataProperty]}`;

        queryParams = [
          {
            TableName: dynamoDbTable,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :GSI1PK",
            ExpressionAttributeValues: {
              ":GSI1PK": GSI1PK,
            },
            ScanIndexForward: false,
            Limit: 1,
          },
        ];
      } else if (previousObservations[i].filter === filters.TOP_2_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_ENTITYID_EQUALS_OBSERVATION_ENTITYID) {
        let GSI1PK = `ET#${previousObservations[i].filterValues[0]}#TY#${previousObservations[i].filterValues[1]}#EI#${observation.entityid}`;

        queryParams = [
          {
            TableName: dynamoDbTable,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :GSI1PK",
            ExpressionAttributeValues: {
              ":GSI1PK": GSI1PK,
            },
            ScanIndexForward: false,
            Limit: 2,
          },
        ];
      } else if (previousObservations[i].filter === filters.TOP_10_WHERE_ENTITY_EQUALS_AND_TYPE_EQUALS_AND_GSI2_IN_LIST_FROM_FUNCTION) {
        const [entity, type, getD2FromObservation] = previousObservations[i].filterValues;
        const D2 = (getD2FromObservation as ObservationFilterFunction)(observation);
        let GSI2PK = `ET#${entity}#TY#${type}#D2#${D2}`;
        this.logger.Log(`[DynamoDBRepository.load.D2] ${filterName}`, { previousObservation: previousObservations[i], observation, GSI2PK });

        queryParams = [
          {
            TableName: dynamoDbTable,
            IndexName: "GSI2",
            KeyConditionExpression: "GSI2PK = :GSI2PK",
            ExpressionAttributeValues: {
              ":GSI2PK": GSI2PK,
            },
            ScanIndexForward: false,
            Limit: 10,
          },
        ];
      } else {
        throw "repositry.load not implemented for filter: " + JSON.stringify(previousObservations[i].filter);
      }
      console.log("queryParams: ", JSON.stringify(queryParams));

      try {
        observationLists[i] = new Array<Observation2<IEntityObservation>>();

        for (let j = 0; j < queryParams.length; j++) {
          let response = await docClient.query(queryParams[j]).promise();
          // Can't log here because it could log secrets
          // console.log("docClient.query response: ", JSON.stringify(response));

          let currentLength = observationLists[i].length;
          if (response && response.Items) {
            for (let k = currentLength; k < currentLength + response.Items.length; k++) {
              let obj = response.Items[k - currentLength];
              let observation: any;
              observation = obj;

              if (observation) {
                observationLists[i][k] = observation;
              }
            }
          }
        }
      } catch (ex) {
        console.error(ex);
      }
    }

    return observationLists;
  }

  public async save(observations: Observation2<IEntityObservation>[]) {
    // let chunks: Observation2<IEntityObservation>[][] = [];

    const items = observations.map((observation) => {
      let dynamoDbItem: any;
      dynamoDbItem = observation;

      dynamoDbItem.PK = "TR#" + observation.traceid.split("-")[0];
      dynamoDbItem.SK = "TS#" + observation.traceid.split("-")[1];
      dynamoDbItem.GSI1PK = "ET#" + observation.entity + "#TY#" + observation.type + "#EI#" + observation.entityid;
      dynamoDbItem.GSI1SK = "TM#" + observation.time;

      if (observation.entity === ComponentDeployment.ENTITY_NAME) {
        const componentDeployment = observation as Observation2<ComponentDeployment.EntityObservation>;
        if (componentDeployment.data.Env && componentDeployment.data.Name) {
          dynamoDbItem.GSI2PK = `ET#${componentDeployment.entity}#TY#${componentDeployment.type}#D2#${componentDeployment.data.Env}:${componentDeployment.data.Name}`;
          dynamoDbItem.GSI2SK = "TM#" + componentDeployment.time;
        }
      } else if (observation.entity == JobRun.ENTITY_NAME) {
        const jobRun = observation as Observation2<JobRun.EntityObservation>;
        if (jobRun.data.AWSResourceArn) {
          dynamoDbItem.GSI2PK = `ET#${jobRun.entity}#TY#${jobRun.type}#D2#${jobRun.data.AWSResourceArn}`;
          dynamoDbItem.GSI2SK = "TM#" + jobRun.time;
        }
      }

      console.log(`[DynamoDBRepository.save] ${observation.entity}:${observation.type}`, { dynamoDbItem });
      return dynamoDbItem;
    });

    const itemsPerBatch = 25;
    const batchedItems = items.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / itemsPerBatch);

      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [];
      }

      resultArray[chunkIndex].push(item);

      return resultArray;
    }, []);

    console.log(`[DynamoDBRepository.save] batches`, { batchedItems });

    const batchWritePromises = batchedItems.map((batch) => {
      const putRequests = batch.map((item) => {
        return {
          PutRequest: {
            Item: item,
          },
        };
      });
      return docClient
        .batchWrite({
          RequestItems: {
            [dynamoDbTable]: putRequests,
          },
        })
        .promise();
    });

    let responses = await Promise.all(batchWritePromises);

    console.log("docClient.batchWrite response: ", JSON.stringify(responses));
  }
}
