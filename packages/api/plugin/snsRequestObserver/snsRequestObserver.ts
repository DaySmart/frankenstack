// import log from '../log/log';
// import { DynamoDbRepository } from "../repository/repository";
// import { send } from '../router/router';
// import generateObservationFromSNS from './generateObservationFromSNS';

import { snsTopicObserver } from 'o18k-ts-aws';
import { getTemplate } from '../../template';

export async function snsRequestObserverWrapper(event, context) {
	const template = getTemplate();
	return snsTopicObserver(event, context, template);
}
//     log("[snsRequestObserver] request", { event, context }, event, context);

//     const repository = new DynamoDbRepository();

//     const [observation] = generateObservationFromSNS(event, context);
//     log("[snsRequestObserver] observation", { observation }, event, context);

//     if (observation) {
//         await repository.save([observation]);
//     }

//     const response = await send([observation], context, log);
//     log("[snsRequestObserver] invoke response", { response }, event, context);
// }
