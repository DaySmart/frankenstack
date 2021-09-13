import { Provider} from "./Provider";

export class Handler<T extends Provider> {
    async run(provider: T): Promise<void> {
        await provider.decryptInputs();
        await provider.provisionComponent();
        await provider.sendResponse();
    }
}