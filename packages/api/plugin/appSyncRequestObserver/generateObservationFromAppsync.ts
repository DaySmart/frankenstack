// import { Observation2 } from "../../generated/Observation2";
// import getComponentRollbackHandler from "./getComponentRollbackHandler";
// import getResolvedInputsHandler from "./getResolvedInputsHandler";
// import putPolicyMutationHandler from "./putPolicyMutationHandler";
// import putUserMutationHandler from "./putUserMutationHandler";
// import sendDeploymentFormHandler from "./sendDeploymentFormHandler";

// export default function generateObservationFromAppSync(
//     event,
//     _context
// ): Observation2<any>[] {
//     const data = event.arguments;
//     const operation = event.info.fieldName;

// switch(operation) {
//     case "sendDeploymentForm":
//         return sendDeploymentFormHandler(data);
//     case "getComponentRollbackState":
//         return getComponentRollbackHandler(data);
//     case "getResolvedInputs":
//         return getResolvedInputsHandler(data);
//     case "putUser":
//         return putUserMutationHandler(data);
//     case "putPolicy":
//         return putPolicyMutationHandler(data);
//     default:
//         throw `Operation not implement ${operation}`;
// }
