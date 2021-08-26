// import { ComponentRollbackQuery } from "../../generated/Entities/ComponentRollbackQuery";
// import { IEntityObservation } from "../../generated/Entities/IEntityObservation";
// import { createExistingObservation, generateTraceId, Observation2 } from "../../generated/Observation2";

// export default function(data): Observation2<IEntityObservation>[] {
//     const observations: Observation2<IEntityObservation>[] = [];

//     const componentRollbackQuery: ComponentRollbackQuery.DataSchema = {
//         Env: data.env,
//         ComponentName: data.componentName
//     };

//     const observation = new ComponentRollbackQuery.EntityObservation(componentRollbackQuery);

//     observations.push(
//         createExistingObservation(
//             observation,
//             generateTraceId(),
//             (new Date()).toISOString(),
//             "0.1",
//             ComponentRollbackQuery.ENTITY_NAME,
//             "sometypeofinstanceid"
//         )
//     );

//     return observations;
// }