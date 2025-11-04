import { Repository } from "../plugin/repository/repository";
import { Observation2 } from "./Observation2";
import { IEntityObservation } from "./Entities/IEntityObservation";
import { Handler } from "./Handler";
import { Query } from "o18k-ts-aws";

export class Decider<T extends IEntityObservation> {
  constructor(
    public traceid: string,
    // queries describing prior observations needed to make a decision
    public filters: Query[],
    // the current/root observation driving these dependent lookups
    public observation: Observation2<IEntityObservation>,
    public handler: Handler<T>,
    public log: any,
    public repository: Repository
  ) {}

  public async execute(): Promise<Observation2<T>[]> {
    // Load dependent observations based on provided queries & current observation context
    const dependentObservations = await this.repository.load(
      this.observation,
      this.filters
    );
    const decisions = this.handler.run(
      dependentObservations,
      this.traceid,
      this.log
    );
    return decisions;
  }
}
