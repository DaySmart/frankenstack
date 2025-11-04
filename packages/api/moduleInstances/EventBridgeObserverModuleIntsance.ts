import { CloudWatchLogObserverHandle, IEntityObservation, EventBridgeObserverModule } from 'o18k-ts-aws';
import { DynamoDbRepository } from '../plugin/repository/repository';
import { DirectRouterModuleInstance } from './DirectRouterModuleInstance';
import { LoggerModuleInstance } from './LoggerModuleInstance';

export class EventBridgeObserverModuleInstance extends EventBridgeObserverModule {
	constructor(handler: CloudWatchLogObserverHandle<IEntityObservation>) {
		super(handler);
		this.logger = new LoggerModuleInstance();
		this.router = new DirectRouterModuleInstance();
		this.repository = new DynamoDbRepository(this.logger);
	}
}
