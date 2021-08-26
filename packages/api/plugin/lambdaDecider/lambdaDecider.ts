// import { receiveDecider, send } from "../router/router";
// import { DynamoDbRepository } from "../repository/repository";
// import log from "../log/log";
// import { IEntityObservation } from "../../generated/Entities/IEntityObservation";
// import { Observation2 } from "../../generated/Observation2";

import { lambdaDecider } from "o18k-ts-aws";
import { getTemplate } from "../../template";

// export const repository = new DynamoDbRepository();

export async function lambdaDeciderWrapper(event, context): Promise<any> {
  const template = getTemplate();
  return lambdaDecider(event, context, template);
}
//   context.callbackWaitsForEmptyEventLoop = true;

//   log("[lambdaDecider] request", { event }, event, context);
//   console.log({ test: process.env.LOCAL_TESTING });

//   const decider = receiveDecider(event, context, log, repository);
//   log("[lambdaDecider] decider", { decider }, event, context);

//   const decisions: Observation2<IEntityObservation>[] = await decider.execute();
//   log("[lambdaDecider] decisions", { decisions }, event, context);

//   if (decisions.length) {
//     await repository.save(decisions);
//   }

//   const result = await send(decisions, context, log);
//   console.log("DONE");
//   if (process.env.LOCAL_TESTING) {
//     return result;
//   }

//   return;
// }
