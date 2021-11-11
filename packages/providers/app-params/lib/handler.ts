import { AppParamsProvider } from "./app-param-provider";
import { Handler } from "@daysmart/frankenstack-base-provider/assets/Handler";

export async function handler(event: any, _context: any) {
  const provider = new AppParamsProvider(event);
  await new Handler<AppParamsProvider>().run(provider);
}
