// import log from '../log/log';
// import { send } from '../router/router';
// import { DynamoDbRepository } from "../repository/repository";
// import generateObservationFromCloudwatchLogs from './generateObservationFromCloudwatchLogs';

import { cloudWatchLogObserver } from "o18k-ts-aws";
import { getTemplate } from "../../template";

export async function cloudWatchLogObserverWrapper(event, context) {
  const template = getTemplate();
  return cloudWatchLogObserver(event, context, template);
}

//     log("[graphqlRequestObserver] request", { event, context }, event, context);

//     const repository = new DynamoDbRepository();

//     const observations = generateObservationFromCloudwatchLogs(event, context);
//     log("[graphqlRequestObserver] observation", { observations }, event, context);

//     if (observations) {
//         await repository.save(observations);
//     }

//     const response = await send(observations, context, log);
//     log("[graphqlRequestObserver] invoke response", { response }, event, context);
