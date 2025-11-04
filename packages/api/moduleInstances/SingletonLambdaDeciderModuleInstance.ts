import { DeciderHandle, IEntityObservation, LambdaDeciderModule, Query } from "o18k-ts-aws";
import { DynamoDbRepository } from "../plugin/repository/repository";
import { DirectRouterModuleInstance } from "./DirectRouterModuleInstance";
import { LoggerModuleInstance } from "./LoggerModuleInstance";

export class SingletonLambdaDeciderModuleInstance extends LambdaDeciderModule {
  constructor(
    public entity: string,
    public type: string,
    public outgoingEntity: string,
    public outgoingType: string,
    public queries: Query[],
    public handle: DeciderHandle<IEntityObservation>,
    public saveToRepository: boolean = true,
  ) {
    super(entity, type, outgoingEntity, outgoingType, queries, handle, saveToRepository);
    this.router = new DirectRouterModuleInstance();
    this.logger = new LoggerModuleInstance();
    this.functionName = process.env.SINGLETON_DECIDER_LAMBDA_FUNCTION_NAME ? process.env.SINGLETON_DECIDER_LAMBDA_FUNCTION_NAME : "Function name not found";
    this.repository = new DynamoDbRepository(this.logger);
  }
}
