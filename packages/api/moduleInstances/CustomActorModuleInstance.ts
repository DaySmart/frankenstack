import { CustomActorHandle, CustomActorModule, IEntityObservation, Query, Throttle } from "o18k-ts-aws";
import { DynamoDbRepository } from "../plugin/repository/repository";
import { DirectRouterModuleInstance } from "./DirectRouterModuleInstance";
import { LoggerModuleInstance } from "./LoggerModuleInstance";

export class CustomActorModuleInstance extends CustomActorModule {
  constructor(
    public name: string,
    public handle: CustomActorHandle<IEntityObservation>,
    public queries: Query[] = [],
    public throttle: Throttle | null = null
  ) {
    super(name, handle, queries, throttle);
    this.logger = new LoggerModuleInstance();
    this.functionName = process.env.CUSTOM_ACTOR_FUNCTION_NAME ? process.env.CUSTOM_ACTOR_FUNCTION_NAME : "Function name not found";
    this.router = new DirectRouterModuleInstance();
    this.repository = new DynamoDbRepository(this.logger);
  }
}
