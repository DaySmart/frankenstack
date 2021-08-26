import { AppSyncRequestResponseActorHandle, AppSyncRequestResponseActorModule, IEntityObservation, Query } from "o18k-ts-aws";
import { DynamoDbRepository } from "../plugin/repository/repository";
import { DirectRouterModuleInstance } from "./DirectRouterModuleInstance";
import { LoggerModuleInstance } from "./LoggerModuleInstance";

export class AppSyncRequestResponseActorModuleInstance extends AppSyncRequestResponseActorModule {
  constructor(public name: string, handler: AppSyncRequestResponseActorHandle<IEntityObservation>, queries: Query[]) {
    super(name, handler, queries);
    this.logger = new LoggerModuleInstance();
    this.router = new DirectRouterModuleInstance();
    this.repository = new DynamoDbRepository(this.logger);
  }
}
