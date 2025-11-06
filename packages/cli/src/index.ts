#!/usr/bin/env node
import AWS from "aws-sdk";
import { EnvironmentServiceAppSyncClient } from "@daysmart/frankenstack-appsync-client";
const ssmConfig = require("./utils/ssmConfig");
const uuid = require("uuid");
const parseYaml = require("./utils/parseYaml");
const flatten = require("flat");
const archiver = require("archiver");
const stream = require("stream");
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { resolveComponents, resolveInputVariables } from "./utils/variables";
import { FileLogger } from "./utils/fileLogger";

// The NodeJS.Global type is no longer exported in recent @types/node versions.
// Use globalThis to augment instead.
declare const global: typeof globalThis & { WebSocket: any };

global.WebSocket = require("ws");
require("es6-promise").polyfill();
require("isomorphic-fetch");

// Surface previously swallowed exceptions so debugging doesn't appear to "do nothing".
process.on("uncaughtException", (err) => {
  console.error(
    "[frank] Uncaught exception:",
    err && err.stack ? err.stack : err
  );
});
process.on("unhandledRejection", (reason: any) => {
  console.error(
    "[frank] Unhandled rejection:",
    reason && reason.stack ? reason.stack : reason
  );
});

interface Template {
  env: string;
  components: Array<Component>;
}

interface Component {
  name: string;
  provider: Provider;
  inputs?: Array<{ key: string; value: string }>;
  outputs?: Array<{ key: string; value: string }>;
}

interface Provider {
  name: string;
  config?: Array<{ key: string; value: string }>;
}

export default class Deployer {
  public file: any;
  public command: any;
  public deploymentGuid: any;
  public config: any;
  public client: any;
  public params: any;
  public logger: FileLogger | null = null;

  constructor(command: any, file: string, config?: any) {
    this.file = file;
    this.command = command;
    this.config = config;
    this.deploymentGuid = uuid.v4();
    this.params = {};
    // Initialize general command logger early; deploy-specific file added after parse.
    try {
      this.logger = new FileLogger({
        command: this.command,
        deploymentGuid: this.deploymentGuid,
      });
      this.logger.log("constructor", {
        deploymentGuid: this.deploymentGuid,
        file,
      });
    } catch (err) {
      console.warn("Failed to initialize file logger", err);
    }
    if (config.params) {
      try {
        this.params = JSON.parse(config.params);
      } catch (err) {
        throw `Failed to parse parameters ${config.params}. Please format your parameters as valid JSON`;
      }
    }
  }

  async run() {
    const credentials = await defaultProvider({
      profile: this.config.profile,
    })();
    AWS.config.credentials = credentials;
    this.logger?.log("credentials-resolved");
    const awsConfig = await ssmConfig(credentials, this.config.stageOveride);
    this.logger?.log("ssm-config-loaded", {
      stage: this.config.stageOveride || "prod",
    });
    const client = new EnvironmentServiceAppSyncClient(
      awsConfig,
      credentials //await (new CredentialProviderChain()).resolvePromise()
    );
    if (this.command === "deploy") {
      await this.deploy(this.config._[3], credentials, awsConfig, client);
    } else if (this.command === "rollback") {
      await this.rollback(this.config._[3], this.config._[4], client);
    } else if (this.command === "iam") {
      await this.putIAM(this.config._[3], client);
    } else if (this.command === "remove") {
      if (this.config.length > 4) {
        await this.remove(this.config._[3], this.config._[4], client);
      } else {
        await this.removeTemplate(this.config._[3], client);
      }
    } else if (this.command === "component") {
      if (this.config._[3] === "describe") {
        await this.describeComponent(
          this.config._[4],
          this.config._[5],
          client
        );
      } else {
        console.error(
          `The command component ${this.config._[3]} is not implemented`
        );
      }
    } else {
      console.error(`The command ${this.command} is not implemented`);
    }
    this.logger?.close("completed");
  }

  async deploy(
    file: string,
    credentials: any,
    awsConfig: any,
    client: EnvironmentServiceAppSyncClient
  ) {
    const template: Template = this.parseComponentTemplate(file);
    console.log("Created deployment", this.deploymentGuid);
    console.log("Packaging project...");
    this.logger?.log("deploy-start", {
      componentCount: template.components.length,
    });

    // List files that will be included in the deployment package (excluding node_modules)
    try {
      const fg = require("fast-glob");
      const files: string[] = fg.sync(["**"], {
        ignore: ["node_modules/**"],
        dot: true,
        onlyFiles: true,
      });
      const maxToShow = process.env.FRANKENSTACK_PACKAGE_FILE_LIMIT
        ? parseInt(process.env.FRANKENSTACK_PACKAGE_FILE_LIMIT, 10)
        : 200;
      console.log(
        `Including ${files.length} files in deployment artifact$${
          files.length > maxToShow ? ` (showing first ${maxToShow})` : ""
        }.`
      );
      files.slice(0, maxToShow).forEach((f) => console.log(`  - ${f}`));
      if (files.length > maxToShow) {
        console.log(
          `  ... (${
            files.length - maxToShow
          } more not displayed; set FRANKENSTACK_PACKAGE_FILE_LIMIT to adjust)`
        );
      }
    } catch (err) {
      console.warn("Could not enumerate package files", err);
      this.logger?.log("package-file-enumeration-error", {
        error: (err as any)?.message || err,
      });
    }

    const output = new stream.PassThrough();
    const archive = archiver("zip");

    output.on("error", function (err: any) {
      console.error(err);
      throw err;
    });

    output.on("end", function () {
      console.log("Package prepared. Uploading to S3...");
    });

    archive.on("error", function (err: any) {
      console.error(err);
      throw err;
    });

    archive.pipe(output);
    archive.glob("**", { ignore: "node_modules/**", dot: true });
    archive.finalize();

    // Allow overriding the target artifact bucket so CodeBuild Source can reference the uploaded zip.
    // If FRANKENSTACK_DEPLOYMENT_BUCKET is set it will take precedence over the Amplify user files bucket.
    const targetBucket =
      process.env.FRANKENSTACK_DEPLOYMENT_BUCKET ||
      awsConfig.aws_user_files_s3_bucket;
    if (!targetBucket) {
      throw "No deployment bucket resolved. Set FRANKENSTACK_DEPLOYMENT_BUCKET or ensure aws_user_files_s3_bucket exists in SSM config.";
    }
    const region = awsConfig.aws_user_files_s3_bucket_region || "us-east-1";
    console.log(
      `Uploading deployment artifact to bucket: ${targetBucket} in region: ${region}`
    );

    const upload = new Upload({
      client: new S3Client({
        region: region,
        credentials: credentials,
      }),
      params: {
        Bucket: targetBucket,
        Key: this.deploymentGuid + `.zip`,
        Body: output,
        ContentType: "application/zip",
      },
    });
    await upload.done();
    console.log("Packaging complete!");
    this.logger?.log("artifact-uploaded", { bucket: targetBucket, region });

    console.log("Submitting deployment request to Frankenstack service...");
    this.logger?.log("deployment-request-start", {
      env: template.env,
      componentCount: template.components.length,
    });
    await this.deployTemplate(client, template);
  }

  async rollback(
    environment: string,
    componentName: string,
    client: EnvironmentServiceAppSyncClient
  ) {
    const rollbackComponentResp = await client.getComponentRollback(
      environment,
      componentName
    );

    if (rollbackComponentResp.data) {
      const componentDeployment =
        rollbackComponentResp.data.getComponentRollbackState;

      const deploymentRequest = await client.getDeploymentRequest(
        componentDeployment.deploymentGuid
      );

      let artifactOverideGuid = componentDeployment.deploymentGuid;
      const artifactOverideGuidItems =
        componentDeployment.provider.config.filter(
          (item: any) => item.name === "artifactOverideGuid"
        );
      if (artifactOverideGuidItems.length > 0) {
        artifactOverideGuid = artifactOverideGuidItems[0].value;
      }

      let providerConfig = componentDeployment.provider.config.filter(
        (item: any) => item.name !== "artifactOverideGuid"
      );

      const template: Template = {
        env: componentDeployment.env,
        components: [
          {
            name: componentDeployment.name,
            provider: {
              name: componentDeployment.provider.name,
              config: [
                { name: "artifactOverideGuid", value: artifactOverideGuid },
                ...providerConfig.map((configItem: any) => {
                  if (configItem.name !== "artifactOverideGuid") {
                    return {
                      name: configItem.name,
                      value: configItem.value,
                    };
                  }
                }),
              ],
            },
            inputs:
              deploymentRequest.data &&
              deploymentRequest.data.getDeploymentRequest.components[0].inputs
                ? deploymentRequest.data.getDeploymentRequest.components[0].inputs.map(
                    (input: any) => {
                      return {
                        name: input.name,
                        value: input.value,
                      };
                    }
                  )
                : undefined,
          },
        ],
      };

      console.log(
        `Rolling back component ${environment}:${componentName} to deployment ${componentDeployment.deploymentGuid}`
      );

      await this.deployTemplate(client, template);
    }
  }

  async remove(
    environment: string,
    componenentName: string,
    client: EnvironmentServiceAppSyncClient
  ) {
    console.log(`Removing component ${environment}:${componenentName}`);
    await client.removeComponent({
      deploymentGuid: this.deploymentGuid,
      env: environment,
      componentName: componenentName,
    });
    this.subscribeToDeploymentUpdates(client);
  }

  async removeTemplate(file: string, client: EnvironmentServiceAppSyncClient) {
    const template: Template = this.parseComponentTemplate(file);
    console.log(
      `Created deployment ${this.deploymentGuid} for component removal`
    );
    const componantNames = template.components.map(
      (component) => component.name
    );
    // API only supports single component removal (componentName); remove each sequentially.
    for (const componentName of componantNames) {
      console.log(
        `Queueing removal for component ${template.env}:${componentName}`
      );
      await client.removeComponent({
        deploymentGuid: this.deploymentGuid,
        env: template.env,
        componentName: componentName,
      });
    }
    this.subscribeToDeploymentUpdates(client);
  }

  async describeComponent(
    environment: string,
    componentName: string,
    client: EnvironmentServiceAppSyncClient
  ) {
    console.log(`Looking up component ${environment} ${componentName}`);
    try {
      const resp = await client.describeComponent(environment, componentName);
      if (resp.data && resp.data.describeComponent) {
        const component = resp.data.describeComponent;
        console.log(`${component.env} ${component.name}
Created: ${new Date(component.create).toUTCString()}
Last Deployment (${component.deploymentGuid}): ${
          component.status
        } at ${new Date(component.update).toUTCString()}
Inputs:
${
  component.inputs
    ? component.inputs
        .map((input: any) => `${input.name}: ${input.value}`)
        .join("\n")
    : "none"
}
Outputs:
${
  component.outputs
    ? component.outputs
        .map((output: any) => `${output.name}: ${output.value}`)
        .join("\n")
    : "none"
}
            `);
      } else {
        console.error(`Could not find component!`);
      }
    } catch (err) {
      console.error(`Could not find component!`);
    }
  }

  async deployTemplate(
    client: EnvironmentServiceAppSyncClient,
    template: Template
  ) {
    console.log(
      `Deploying ${template.components.length} component(s) to environment: ${template.env}`
    );
    template.components.forEach((component, index) => {
      console.log(
        `  ${index + 1}. ${component.name} (provider: ${component.provider.name})`
      );
    });
    this.logger?.log("sending-deployment-form", {
      componentNames: template.components.map((c) => c.name),
    });
    await client.sendDeploymentForm(this.deploymentGuid, template);
    console.log("Deployment request submitted successfully.");
    console.log("Waiting for deployment updates...");
    this.logger?.log("deployment-form-sent", { deploymentGuid: this.deploymentGuid });
    this.subscribeToDeploymentUpdates(client);
  }

  subscribeToDeploymentUpdates(client: EnvironmentServiceAppSyncClient) {
    const observable = client.subscribeToDeploymentUpdate(this.deploymentGuid);

    const realtimeResults = (data: any) => {
      /*
      data:{
        deploymentGuid: "83619bc0-48f1-4360-bf44-25dd2a6fcb62",
        type: "INFO",
        message: "[Container] 2025/11/05 15:40:47.373880 Waiting for agent ping",
        moreInfoComponentName: null,
        moreInfoType: null,
        moreInfoKey: null,
        __typename: "DeploymentUpdate",
        componentName: data.ComponentName,
        jobRunGuid: data.JobRunGuid,
        status: data.Error ? "FAILED" : "IN_PROGRESS",
      }
      */
      console.log(data.data.subscribeToDeploymentUpdate.message);
      this.logger?.logDeploymentEvent(data.data.subscribeToDeploymentUpdate);
      let updateType = data.data.subscribeToDeploymentUpdate.type;
      if (["DONE", "ERROR"].includes(updateType)) {
        let exitCode = updateType === "ERROR" ? 1 : 0;
        try {
          subscription.unsubscribe();
          this.logger?.close(updateType === "ERROR" ? "error" : "done");
          process.exit(exitCode);
        } catch (err) {}
      }
    };
    const subscription = observable.subscribe({
      next: (data: any) => {
        realtimeResults(data);
      },
      error: (error: any) => {
        console.warn(error);
      },
    });
  }

  async putIAM(file: string, client: EnvironmentServiceAppSyncClient) {
    var template = parseYaml(file);

    if (template.policies) {
      for (var policy of template.policies) {
        try {
          const resp = await client.putPolicy({
            policyName: policy.name,
            statements: policy.statements.map((statement: any) => {
              return {
                effect: statement.effect,
                actions: statement.actions,
                resources: statement.resources,
              };
            }),
          });

          console.log(`Succesfully updated policy: ${policy.name}`);
        } catch (err) {
          console.error(`Failed to put policy: ${policy.name}`, err);
        }
      }

      for (var user of template.users) {
        try {
          const resp = await client.putUser({
            userId: user.id,
            email: user.email,
            policies: user.policies,
          });

          console.log(`Succesfully updated user: ${user.id}`);
        } catch (err) {
          console.error(`Failed to put user: ${user.id}`, err);
        }
      }
    }
  }

  parseComponentTemplate(file: string) {
    var template = parseYaml(file);
    template.env = resolveInputVariables(template.env, template, this.params);
    template = resolveComponents(template, this.params);
    if (template.templates) {
      template.templates.forEach((child: any) => {
        if (!child.path) {
          throw "Could not resolve child template without path";
        }
        const childTemplatePath = resolveInputVariables(
          child.path,
          template,
          this.params
        );
        var childTemplate = parseYaml(childTemplatePath);
        childTemplate.env = resolveInputVariables(
          childTemplate.env,
          childTemplate,
          { ...this.params, ...child.params }
        );
        if (childTemplate.env !== template.env) {
          throw "Child templates must have the same environment as the parent template";
        }
        childTemplate = resolveComponents(childTemplate, {
          ...this.params,
          ...child.params,
        });
        template.components = template.components.concat(
          childTemplate.components
        );
      });
      delete template.templates;
    }
    return template;
  }
}
