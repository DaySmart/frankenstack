// import { JobRunFinished } from "../../generated/Entities/JobRunFinished";
// import { createExistingObservation, generateTraceId, Observation2 } from "../../generated/Observation2";

// export default function generateObservationFromSNS(
//     event,
//     _context
// ): Observation2<any>[] {
//     const observations = [];
//     const data = JSON.parse(event.Records[0].Sns.Message);

//     const jobFinished: JobRunFinished.DataSchema = {
//         DeploymentGuid: data.deploymentGuid,
//         Env: data.env,
//         JobRunGuid: data.jobRunGuid,
//         Name: data.name,
//         Status: data.status,
//         Outputs: JSON.parse(data.outputs)
//     }

//     const observation = new JobRunFinished.EntityObservation(jobFinished);

//     observations.push(
//         createExistingObservation(
//             observation,
//             generateTraceId(),
//             (new Date()).toISOString(),
//             "0.1",
//             "daysmart.environmentservice.api.jobrunfinished",
//             "sometypeofinstanceid"
//         )
//     );

//     return observations;
// }