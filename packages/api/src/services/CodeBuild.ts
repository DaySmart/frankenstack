import { CodeBuild } from "aws-sdk";
const yaml = require("js-yaml");

const client = new CodeBuild();
const S3_BUCKET = process.env.S3_BUCKET;

export interface CodeBuildTriggerParams {
  deploymentGuid: string;
  jobRunGuid: string;
  componentName: string;
  componentEnvironment: string;
  componentProvider: string;
  componentProviderName: string;
  componentInputs?: string;
  buildDir?: string;
  artifactOverideGuid?: string;
  Method?: string;
  nodejsVersion: number | undefined;
}

export module CodeBuildClient {
  export async function triggerCodeBuild(
    params: CodeBuildTriggerParams,
    log: any
  ): Promise<CodeBuild.StartBuildOutput> {
    try {
      const artifactGuid = params.artifactOverideGuid
        ? params.artifactOverideGuid
        : params.deploymentGuid;
      // Determine desired Node.js runtime. Historically 'cdk' defaulted to 14, but AWS SDK v3 packages now
      // require >=18. Unless FRANKENSTACK_ALLOW_LEGACY_NODE is explicitly set, we auto-upgrade any
      // requested version <18 to 18 and log a notice so builds stop emitting EBADENGINE warnings.
      let nodejsVersion =
        params.componentProviderName === "cdk"
          ? params.nodejsVersion || 18
          : params.nodejsVersion || 22;
      if (nodejsVersion < 18 && !process.env.FRANKENSTACK_ALLOW_LEGACY_NODE) {
        log(
          "[codebuild] upgrading nodejsVersion to 18 due to engine requirements",
          { requested: nodejsVersion }
        );
        nodejsVersion = 18;
      }
      let codeBuildParams: CodeBuild.StartBuildInput = {
        projectName: process.env.CODE_BUILD_PROJECT as string,
        buildspecOverride: generateBuildSpec(params.buildDir, nodejsVersion),
        sourceLocationOverride: `${S3_BUCKET}/${artifactGuid}.zip`,
        privilegedModeOverride: true,
        environmentVariablesOverride: [
          { name: "COMPONENT_PROVIDER", value: params.componentProvider },
          { name: "COMPONENT_ENVIRONMENT", value: params.componentEnvironment },
          { name: "COMPONENT_NAME", value: params.componentName },
          { name: "DEPLOYMENT_GUID", value: params.deploymentGuid },
          { name: "JOB_RUN_GUID", value: params.jobRunGuid },
          {
            name: "JOB_RUN_FINISHED_TOPIC_ARN",
            value: process.env.JOB_RUN_FINISH_SNS_TOPIC as string,
          },
          { name: "IN_FRANKENSTACK", value: "true" },
          { name: "STAGE", value: process.env.STAGE as string },
          { name: "PROVIDER_METHOD", value: params.Method || "deploy" },
        ],
        logsConfigOverride: {
          cloudWatchLogs: {
            groupName: process.env.CODE_BUILD_LOG_GROUP,
            streamName: params.jobRunGuid,
            status: "ENABLED",
          },
        },
      };
      // Select appropriate CodeBuild image based on Node version. Standard images map:
      // 5.0 -> Node 16, 6.0 -> Node 18, 7.0 -> Node 20. Node 14 also supported by 5.0.
      if (nodejsVersion === 14 || nodejsVersion === 16) {
        codeBuildParams.imageOverride = "aws/codebuild/standard:5.0";
      } else if (nodejsVersion === 18) {
        codeBuildParams.imageOverride = "aws/codebuild/standard:6.0";
      } else if (nodejsVersion >= 20) {
        codeBuildParams.imageOverride = "aws/codebuild/standard:7.0";
      }

      if (
        params.componentInputs &&
        codeBuildParams.environmentVariablesOverride
      ) {
        codeBuildParams.environmentVariablesOverride.push({
          name: "COMPONENT_INPUTS",
          value: params.componentInputs,
        });
      }
      log("[action] request", { codeBuildParams });
      const resp = await client.startBuild(codeBuildParams).promise();
      log("[action] response", { resp });
      return resp;
    } catch (err) {
      log("[action] response", { err });
      throw err;
    }
  }

  function generateBuildSpec(
    buildDir?: string,
    nodejsVersion?: number
  ): string {
    // Allow overriding the deployer branch without code change.
    const deployerBranchName =
      process.env.DEPLOYER_BRANCH || "env-service-refactor";
    // NOTE: The deployment artifact for certain providers (e.g. 'hardcoded') may not contain a package.json.
    // The previous unconditional 'npm install' caused CodeBuild to fail with ENOENT when package.json was absent.
    // We now guard the install step so it only runs when a package.json exists, mirroring the conditional logic
    // found in the serverless-generated BuildSpec. This keeps minimal artifacts (template + script only) working.
    const installCommands = buildDir
      ? [
          `echo "Install phase started with build directory: ${buildDir}"`,
          `cd ${buildDir}`,
          `if [ -f package.json ]; then echo \"package.json found in ${buildDir} -> installing deps\"; npm ci || npm install; else echo \"No package.json found in ${buildDir}, skipping npm install\"; fi`,
          `echo "Install phase finished in ${buildDir}"`,
        ]
      : [
          'echo "Install phase started"',
          'if [ -f package.json ]; then echo "package.json found -> installing deps"; npm ci || npm install; else echo "No package.json found, skipping npm install"; fi',
        ];

    const buildSpecObj = {
      version: "0.2",
      proxy: {
        "upload-artifacts": "yes",
        logs: "yes",
      },
      phases: {
        install: {
          "runtime-versions": {
            nodejs: nodejsVersion,
          },
          commands: installCommands,
        },
        pre_build: {
          commands: [
            'echo "Pre-build: installing deployer"',
            `git clone --depth 1 --branch ${deployerBranchName} https://github.com/DaySmart/deployer.git /tmp/deployer`,
            "cd /tmp/deployer",
            "npm ci || npm install",
            "npm link",
            'command -v deployer >/dev/null 2>&1 && echo "Deployer installed successfully" || echo "Deployer NOT installed"',
            // Enforce strict unhandled promise rejection behavior to avoid silent failures.
            'export NODE_OPTIONS="--unhandled-rejections=strict"',
            // Validate provider module presence early; built-in providers live inside the deployer repo and do not need external resolution.
            // Built-ins: cdk, serverless, hardcoded, dsicollectionDynamicEnvironment
            `node -e 'try { const raw=process.env.COMPONENT_PROVIDER||"{}"; const p=JSON.parse(raw); const name=p.Name; if(!name){ console.error("COMPONENT_PROVIDER missing Name"); process.exit(1);} const builtIns=["cdk","serverless","hardcoded","dsicollectionDynamicEnvironment"]; if(builtIns.includes(name)){ console.log("Provider built-in:", name, "- skipping external module check"); process.exit(0);} try { require.resolve(name); console.log("Provider module resolved:", name); } catch (e) { console.error("Provider module NOT found:", e.message, "Ensure it is in dependencies of your buildDir package.json and included in the artifact."); process.exit(1);} } catch (e) { console.error("Failed to parse COMPONENT_PROVIDER:", e.message); process.exit(1);} '`,
          ],
        },
        build: {
          commands: ["deployer"],
        },
      },
    };
    try {
      const buildSpec = yaml.dump(buildSpecObj);
      console.log("buildSpec.yml", buildSpec);
      return buildSpec;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
