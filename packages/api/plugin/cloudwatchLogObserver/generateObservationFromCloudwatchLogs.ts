// import { JobRunUpdate } from "../../generated/Entities/JobRunUpdate";
// import { createExistingObservation, generateTraceId, Observation2 } from "../../generated/Observation2";
// import { gunzipSync } from 'zlib';

// export default function generateObservationFromCloudwatchLogs(
//     event,
//     _context
// ): Observation2<any>[] {
//     const observations = [];
//     const data = event.awslogs.data;
//     const buffer = Buffer.from(data, 'base64');
//     const payload = gunzipSync(buffer).toString('ascii');
//     console.log('payload', payload);
//     const message = JSON.parse(payload);

//     console.log('message', message);

//     for(var logEvent of message.logEvents) {
//         const jobRunUpdate: JobRunUpdate.DataSchema = {
//             CloudWatchGroupName: message.logGroup,
//             JobRunGuid: message.logStream.split('/')[0],
//             CloudWatchLogStream: message.logStream,
//             Message: logEvent.message
//         }

//         const observation = new JobRunUpdate.EntityObservation(jobRunUpdate);

//         observations.push(
//             createExistingObservation(
//                 observation,
//                 generateTraceId(),
//                 (new Date()).toISOString(),
//                 "0.1",
//                 "daysmart.environmentservice.api.jobrunupdate",
//                 "sometypeofinstanceid"
//             )
//         )
//     }

//     return observations;
// }