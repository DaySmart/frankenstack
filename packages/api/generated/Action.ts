import { IEntityObservation } from './Entities/IEntityObservation';
import { Observation2 } from './Observation2';
import { Processor } from './Processor';
import { Repository } from '../plugin/repository/repository';

export abstract class Action implements Processor {
	constructor(
		public observation: Observation2<IEntityObservation>,
		public log: any, //dependency injection for logging
		public repository: Repository
	) {}

	public async execute() {
		return await this.callHandler(this.observation);
	}

	abstract callHandler(observation: Observation2<IEntityObservation>);
}
