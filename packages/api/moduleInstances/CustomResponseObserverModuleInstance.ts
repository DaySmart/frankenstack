import { CustomResponseObserverHandle, CustomResponseObserverModule, IEntityObservation } from "o18k-ts-aws";
import { DynamoDbRepository } from "../plugin/repository/repository";
import { DirectRouterModuleInstance } from "./DirectRouterModuleInstance";
import { LoggerModuleInstance } from "./LoggerModuleInstance";

export class CustomResponseObserverModuleInstance extends CustomResponseObserverModule {
  constructor(public handle: CustomResponseObserverHandle<IEntityObservation>) {
    super(handle);
    this.logger = new LoggerModuleInstance();
    this.functionName = process.env.CUSTOM_ACTION_FUNCTION_NAME ? process.env.CUSTOM_ACTION_FUNCTION_NAME : "Function name not found";
    this.router = new DirectRouterModuleInstance();
    this.repository = new DynamoDbRepository(this.logger);
  }
}
