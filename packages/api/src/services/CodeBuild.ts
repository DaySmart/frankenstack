import { CodeBuild } from 'aws-sdk';
const yaml = require('js-yaml');

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
    export async function triggerCodeBuild(params: CodeBuildTriggerParams, log: any): Promise<CodeBuild.StartBuildOutput> {
        try {
            const artifactGuid = params.artifactOverideGuid ? params.artifactOverideGuid : params.deploymentGuid;
            const nodejsVersion = params.componentProviderName === 'cdk' ? 14 : (params.nodejsVersion || 22);
            let codeBuildParams: CodeBuild.StartBuildInput = {
                projectName: process.env.CODE_BUILD_PROJECT as string,
                buildspecOverride: generateBuildSpec(params.buildDir, nodejsVersion),
                sourceLocationOverride: `${S3_BUCKET}/${artifactGuid}.zip`,
                privilegedModeOverride: true,
                environmentVariablesOverride: [
                    {name: 'COMPONENT_PROVIDER', value: params.componentProvider},
                    {name: 'COMPONENT_ENVIRONMENT', value: params.componentEnvironment},
                    {name: 'COMPONENT_NAME', value: params.componentName},
                    {name: 'DEPLOYMENT_GUID', value: params.deploymentGuid},
                    {name: 'JOB_RUN_GUID', value: params.jobRunGuid},
                    {name: 'JOB_RUN_FINISHED_TOPIC_ARN', value: process.env.JOB_RUN_FINISH_SNS_TOPIC as string},
                    {name: 'IN_FRANKENSTACK', value: 'true'},
                    {name: 'STAGE', value: process.env.STAGE as string},
                    {name: 'PROVIDER_METHOD', value: params.Method || "deploy"}
                ],
                logsConfigOverride: {
                    cloudWatchLogs: {
                        groupName: process.env.CODE_BUILD_LOG_GROUP,
                        streamName: params.jobRunGuid,
                        status: 'ENABLED'
                    }
                }
            }
                        // Select appropriate CodeBuild image based on Node version. Standard images map:
                        // 5.0 -> Node 16, 6.0 -> Node 18, 7.0 -> Node 20. Node 14 also supported by 5.0.
                        if (nodejsVersion === 14 || nodejsVersion === 16) {
                            codeBuildParams.imageOverride = 'aws/codebuild/standard:5.0';
                        } else if (nodejsVersion === 18) {
                            codeBuildParams.imageOverride = 'aws/codebuild/standard:6.0';
                        } else if (nodejsVersion >= 20) {
                            codeBuildParams.imageOverride = 'aws/codebuild/standard:7.0';
                        }



            if(params.componentInputs && codeBuildParams.environmentVariablesOverride) {
                codeBuildParams.environmentVariablesOverride.push({name: 'COMPONENT_INPUTS', value: params.componentInputs})
            }
            log("[action] request", { codeBuildParams });
            const resp = await client.startBuild(codeBuildParams).promise();
            log("[action] response", { resp });
            return resp
        } catch(err) {
            log("[action] response", { err });
            throw err;
        }
    }

    function generateBuildSpec(buildDir?: string, nodejsVersion?: number): string {
        const deployerBranchName = 'env-service-refactor';
        // NOTE: The deployment artifact for certain providers (e.g. 'hardcoded') may not contain a package.json.
        // The previous unconditional 'npm install' caused CodeBuild to fail with ENOENT when package.json was absent.
        // We now guard the install step so it only runs when a package.json exists, mirroring the conditional logic
        // found in the serverless-generated BuildSpec. This keeps minimal artifacts (template + script only) working.
        const installCommands = buildDir ? [
            `cd ${buildDir}`,
            `if [ -f package.json ]; then echo \"package.json found in ${buildDir} -> installing deps\"; npm ci || npm install; else echo \"No package.json found in ${buildDir}, skipping npm install\"; fi`
        ] : [
            'echo "Install phase started"',
            'if [ -f package.json ]; then echo "package.json found -> installing deps"; npm ci || npm install; else echo "No package.json found, skipping npm install"; fi'
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
                                    "npm config set prefer-online true",
                                    "npm cache clean --force",
                                    "rm -rf ~/.npm/_cacache 2>/dev/null || true",
                                    // Primary install using explicit git+https URL (more robust than the github: shorthand in some environments)
                                    `npm install -g git+https://github.com/DaySmart/deployer.git#${deployerBranchName} || echo \"Primary global install failed, will attempt fallback clone\"`,
                                    // Fallback: shallow clone then local install and link, only if global binary not present
                                    'command -v deployer >/dev/null 2>&1 || { echo "Fallback: cloning deployer"; git clone --depth 1 --branch env-service-refactor https://github.com/DaySmart/deployer.git /tmp/deployer && cd /tmp/deployer && (npm ci || npm install) && npm link || echo "Fallback deployer install failed"; }',
                                    'command -v deployer >/dev/null 2>&1 && echo "Deployer installed successfully" || echo "Deployer NOT installed"'
                                ],
            },
            build: {
              commands: ["deployer"],
            },
          },
        };
        try {
            const buildSpec = yaml.dump(buildSpecObj);
            console.log('buildSpec.yml', buildSpec);
            return buildSpec;
        } catch(err) {
            console.error(err);
            throw err;
        }
    }
}
