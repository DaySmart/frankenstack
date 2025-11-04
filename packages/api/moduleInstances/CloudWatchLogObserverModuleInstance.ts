import { CloudWatchLogObserverHandle, CloudWatchLogObserverModule, IEntityObservation } from 'o18k-ts-aws';
import { DynamoDbRepository } from '../plugin/repository/repository';
import { DirectRouterModuleInstance } from './DirectRouterModuleInstance';
import { LoggerModuleInstance } from './LoggerModuleInstance';

export class CloudWatchLogObserverModuleInstance extends CloudWatchLogObserverModule {
	constructor(handler: CloudWatchLogObserverHandle<IEntityObservation>, saveToRepository = true) {
		super(handler, saveToRepository);
		this.logger = new LoggerModuleInstance();
		this.router = new DirectRouterModuleInstance();
		this.repository = new DynamoDbRepository(this.logger);
	}
}
