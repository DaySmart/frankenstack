// import log from "../log/log";
// import prevalidate from "./prevalidate";
// import { send } from "../router/router";
// import generateObservationFromAPIGateway from "./generateObservationFromAPIGateway";

// export async function httpRequestObserver(event, context) {
//   // call the log function
//   log("[httpRequestObserver] request", { event, context }, event, context);
//   prevalidate(event);

//   const [observation] = generateObservationFromAPIGateway(event, context);
//   log("[httpRequestObserver] observation", { observation }, event, context);

//   const response = await send([observation], context, log);
//   log("[httpRequestObserver] invoke response", { response }, event, context);

//   return { statusCode: 202 };
// }
