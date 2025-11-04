import { Repository } from "../plugin/repository/repository";
import { Observation2 } from "./Observation2";
import { IEntityObservation } from "./Entities/IEntityObservation";
import { Handler } from "./Handler";

export class Decider<T extends IEntityObservation> {
  constructor(
    public traceid: string,
    public filters: any,
    public handler: Handler<T>,
    public log: any,
    public repository: Repository
  ) {}

  public async execute(): Promise<Observation2<T>[]> {
    const dependentObservations = await this.repository.load(this.filters);
    const decisions = this.handler.run(
      dependentObservations,
      this.traceid,
      this.log
    );
    //compare
    return decisions;
  }
}
