import { Provider } from "./Provider";
export declare class Handler<T extends Provider> {
    run(provider: T): Promise<void>;
}
