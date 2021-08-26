import { SecretsProvider } from "./secrets-provider";
import { Handler } from "@daysmart/frankenstack-base-provider/assets/Handler";

export async function handler(event: any, _context: any) {
  const provider = new SecretsProvider(event);
  await new Handler<SecretsProvider>().run(provider);
}
