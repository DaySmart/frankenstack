// // import { CustomerForm } from "../../generated/Entities/CustomerForm";
// import { Observation2 } from "../../generated/Observation2";
// // import GenericHandler from "./GenericHandler";
// import SalesForceAccountsModifiedListHandler from "./SalesForceAccountsModifiedListHandler";

// export default function generateObservationFromAPIGateway(
//   event,
//   _context
// ): Observation2<any>[] {
//   const path = event.pathParameters.proxy;

//   if (path === "SalesForceAccountsModifiedList") {
//     return SalesForceAccountsModifiedListHandler(event);
//   } else if (path === "Customer") {
//     // return GenericHandler(CustomerForm.Full.EntityObservation, event);
//   }

//   throw new Error("Path not accepted: " + path);
// }
