// import log from "../log/log";
// // import { receiveAction } from "../router/router";
// // import { DynamoDbRepository } from "../repository/repository";

import { customActor } from "o18k-ts-aws";
import { getTemplate } from "../../template";

export async function customActorWrapper(event, context) {
  const template = getTemplate();
  return customActor(event, context, template);
}
//   log("[httpAction] event", { event }, event, context);

//   // const repository = new DynamoDbRepository();

//   // const action = receiveAction(event, context, log, repository);
//   // log("[httpAction] action", { action }, event, context);

//   // const resp = await action.execute();

//   // if(resp) {
//   //   log("[httpAction] resp", {resp}, event, context);

//   // }

//   //implementation of coupled action requests
//   //   if ()

//   //   const response = await send(decisions);
//   //   log("[httpAction] decisions", { decisions }, event, context);
// }
