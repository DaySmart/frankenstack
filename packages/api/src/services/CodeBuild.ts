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
    componentInputs?: string;
    buildDir?: string;
    artifactOverideGuid?: string;
    Method?: string;
}

export module CodeBuildClient {
    export async function triggerCodeBuild(params: CodeBuildTriggerParams, log: any): Promise<CodeBuild.StartBuildOutput> {
        try {
            const artifactGuid = params.artifactOverideGuid ? params.artifactOverideGuid : params.deploymentGuid;
            let codeBuildParams: CodeBuild.StartBuildInput = {
                projectName: process.env.CODE_BUILD_PROJECT as string,
                buildspecOverride: generateBuildSpec(params.buildDir),
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

    function generateBuildSpec(buildDir?: string): string {
        const deployerBranchName = 'env-service-refactor';
        const buildSpecObj = {
            version: '0.2',
            proxy: {
                'upload-artificats': 'yes',
                logs: 'yes'
            },
            phases: {
                install: {
                    'runtime-versions': {
                        nodejs: 12
                    },
                    commands: buildDir ? [
                        `cd ${buildDir}`,
                        'npm install'
                    ] : ['npm install']
                },
                'pre_build': {
                    commands: [
                        'exit 1',
                        `npm install -g git+https://github.com/DaySmart/deployer.git#${deployerBranchName}`
                    ]
                },
                build: {
                    commands: [
                        'deployer'
                    ]
                }
            }
        }
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