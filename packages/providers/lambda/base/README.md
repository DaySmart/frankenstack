# Frankenstack Base Provider
Base CDK construct for provisioning custom frankenstack providers. (Currently on lambda)

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests

 ## Usage
 To provision a custom provider structure your provider project like this:
 ```
 lib
   handler.ts
   my-provider.ts
 index.ts
 template.yml
 ```

 ### lib/handler.ts
 ```
 import { MyProvider } from "./my-provider";
 import { Handler } from "@daysmart/frankenstack-base-provider/assets/Handler";

 export async function handler(event: any, _context: any) {
   const provider = new MyProvider(event);
   await new Handler<MyProvider>().run(provider);
 }
 ```

 ### lib/my-provider.ts
 ```
 import { Provider } from "@daysmart/frankenstack-base-provider/assets/Provider";

 export class MyProvider extends Provider {
     async provisionComponent() {
         // implement the logic for how to provision your custom component
     }
 }
 ```

 ### index.ts
 ```
 import * as cdk from '@aws-cdk/core';
 import { ProviderProps, ProviderStack } from '@daysmart/frankenstack-base-provider';

 export class MyProvider extends ProviderStack {
     constructor(scope: cdk.Construct, id: string, props: ProviderProps) {
         super(scope, id, props);

         // Any customization to the lambda function can
         // be added by accessing this.lambda
     }
 }
 ```

 ### template.yml
 ```
 env: provider
 components:
   - name: my-provider
     provider:
       name: cdk
       config:
         constructPath: index
         account: aws_account_id
         region: aws_region
     inputs:
       providerName: my-provider
       compute: LAMBDA
       handler: handler
       entry: lib/handler.ts
 ```

 ## Provisioning your provider:
 The provider can be provisioned using the frank cli just like any other component:
 ```
 frank deploy template.yml
 ```
 Once the provider has been sucessfully provisioned the provider can be used by 
 referencing the `providerName` input value.

