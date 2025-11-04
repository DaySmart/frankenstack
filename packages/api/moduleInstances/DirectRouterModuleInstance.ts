import { DirectRouterModule } from 'o18k-ts-aws';
import { LoggerModuleInstance } from './LoggerModuleInstance';

export class DirectRouterModuleInstance extends DirectRouterModule {
	constructor() {
		super();
		this.logger = new LoggerModuleInstance();
	}
}
