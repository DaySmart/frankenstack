import { AwsAccountProvider } from './aws-account-provider';
import { Handler } from '@daysmart/frankenstack-base-provider/assets/Handler';

export async function handler(event: any, _context: any) {
    const provider = new AwsAccountProvider(event);
    await new Handler<AwsAccountProvider>().run(provider);
}