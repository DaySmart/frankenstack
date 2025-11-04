import { IEntityObservation } from './Entities/IEntityObservation';
import { Observation2 } from './Observation2';

export interface Handler<T extends IEntityObservation> {
	run(dependentObservations: any, traceid: string, log: any): Observation2<T>[];
}
