// import { IEntityObservation } from "../../generated/Entities/IEntityObservation";
// import {
//   createExistingObservation,
//   generateTraceId,
//   Observation2,
// } from "../../generated/Observation2";

// export default function <T extends IEntityObservation>(
//   c: new (data) => T,
//   event
// ): Observation2<T>[] {
//   const data = JSON.parse(event.body);
//   const entity = new c(data);
//   const time = new Date(event.requestContext.requestTimeEpoch).toISOString();

//   return [
//     //TODO: Check if these values are passed over in the http request
//     createExistingObservation(
//       entity,
//       generateTraceId(),
//       time,
//       "0.1",
//       "observer",
//       "l"
//     ),
//   ];
// }
