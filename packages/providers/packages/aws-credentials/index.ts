import { SSOOIDCClient, RegisterClientCommand, StartDeviceAuthorizationCommand, CreateTokenCommand, AuthorizationPendingException } from '@aws-sdk/client-sso-oidc';
import { SSOClient, ListAccountRolesCommand, GetRoleCredentialsCommand } from '@aws-sdk/client-sso';
import { Credentials } from 'aws-sdk';
import { BaseProvider } from 'frankenstack-base-provider';
const fs = require('fs');
const open = require('open');
const os = require('os');
const storage = require('node-persist');
const path = require('path');
const promptList = require('prompt-list');
const prompts = require('prompts');

const oidcClient = new SSOOIDCClient({region: 'us-west-2'});
const ssoClient = new SSOClient({region: 'us-west-2'});

export interface FrankenstackCredentialsProvider {
    generateCredentials(account: string): Promise<any>;
}

export class AWSCredentialsProvider extends BaseProvider implements FrankenstackCredentialsProvider {
    constructor(config: any) {
        super(config);
    }

    async deploy(): Promise<void> {
        if(this.config.componentProvider.account && this.config.componentProvider.account.accountId) {
            const credentials = await this.generateCredentials(this.config.componentProvider.account.accountId);
            this.outputs = [
                {Key: 'accessKeyId', Value: credentials.accessKeyId},
                {Key: 'secretAccessKey', Value: credentials.secretAccessKey},
                {Key: 'sessionToken', Value: credentials.sessionToken}
            ]
            this.result = true;
        }
    }

    async getToken(clientId: string, clientSecret: string, deviceCode: string) {
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        while(true) {
            const createTokenCommand = new CreateTokenCommand({
                clientId: clientId,
                clientSecret: clientSecret,
                deviceCode: deviceCode,
                grantType: 'urn:ietf:params:oauth:grant-type:device_code'
            });
            try {
                const createToken = await oidcClient.send(createTokenCommand);
                return createToken;
            } catch(AuthorizationPendingException) {
                await delay(5000);
            }
        }
    }
    
    async generateCredentials(account: string): Promise<Credentials> {
        await storage.init({
            dir: path.join(os.homedir(), '.frankenstack'),
            stringify: JSON.stringify,
            parse: JSON.parse,
        });
        const ssoClient = await this.getOIDCClient();
        const accessToken = await this.getDeviceAuthorization(ssoClient.clientId, ssoClient.clientSecret);
        const role = await this.getRolesForAccount(accessToken, account);
    
        const creds = await this.generateCredentialsWithRole(accessToken, account, role);
        return creds;
    }
    
    async getOIDCClient(): Promise<{clientId: string, clientSecret: string}> {
        const oidcClientConfig = await storage.getItem('aws-sso-oidc-client');
        if(oidcClientConfig && oidcClientConfig.clientSecretExpiresAt > Date.now() / 1000) {
            return {clientId: oidcClientConfig.clientId, clientSecret: oidcClientConfig.clientSecret};
        } else {
            const registerClient = new RegisterClientCommand({
                clientName: 'frankenstack',
                clientType: 'public'
            });
        
            const clientConfig = await oidcClient.send(registerClient);
            storage.setItem('aws-sso-oidc-client', clientConfig);
            return {clientId: clientConfig.clientId as string, clientSecret: clientConfig.clientSecret as string};
        }
    }
    
    async getDeviceAuthorization(clientId: string, clientSecret: string): Promise<string> {
        const tokenCache = await storage.getItem('sso-token');
        console.log(tokenCache);
        if(tokenCache && tokenCache.accessToken) {
            console.log('cache hit on token');
            return tokenCache.accessToken;
        } else {
            let startUrl = await storage.getItem('sso-startUrl');
            if(!startUrl) {
                const startUrlPromptResp = await prompts({
                    type: 'text',
                    name: 'startUrl',
                    message: 'What is the AWS SSO start URL? i.e. https://example-sso.awsapps.com/start'
                });
                startUrl = startUrlPromptResp.startUrl;
                await storage.setItem('sso-startUrl', startUrl);
            }
            const deviceAuthorizationCommand = new StartDeviceAuthorizationCommand({
                clientId: clientId,
                clientSecret: clientSecret,
                startUrl: startUrl
             });
         
             const deviceAuthorization = await oidcClient.send(deviceAuthorizationCommand);
         
             await open(deviceAuthorization.verificationUriComplete, {wait: true});
         
             const tokenResp = await this.getToken(clientId, clientSecret, deviceAuthorization.deviceCode as string);
             
             if(tokenResp.accessToken && tokenResp.expiresIn) {
                await storage.setItem('sso-token', tokenResp, {ttl: tokenResp.expiresIn * 1000});
                return tokenResp.accessToken
             } else {
                 throw "Could not generate SSO access token";
             }
        }
    }
    
    async generateCredentialsWithRole(accessToken: string, accountId: string, roleName: string): Promise<Credentials> {
        const getRoleCredentialsCommand = new GetRoleCredentialsCommand({
            accessToken: accessToken,
            accountId: accountId,
            roleName: roleName
        });
        const roleCreds = await ssoClient.send(getRoleCredentialsCommand);
        if(roleCreds.roleCredentials && roleCreds.roleCredentials.accessKeyId && roleCreds.roleCredentials.secretAccessKey) {
            return new Credentials({
                accessKeyId: roleCreds.roleCredentials.accessKeyId,
                secretAccessKey: roleCreds.roleCredentials.secretAccessKey,
                sessionToken: roleCreds.roleCredentials.sessionToken
            });
        } else {
            throw "Could not get credentials for role with access token"
        }
    }
    
    async getRolesForAccount(accessToken: string, accountId: string): Promise<string> {
        let roleList: string[] = [];
        const listAccountRolesCommand = new ListAccountRolesCommand({
            accessToken,
            accountId: accountId
        });
        const accountRolesListResp = await ssoClient.send(listAccountRolesCommand);
        if(accountRolesListResp.roleList && accountRolesListResp.roleList.length > 0) {
            roleList = roleList.concat(...accountRolesListResp.roleList.map(role => role.roleName as string));
            if(accountRolesListResp.nextToken) {
                let nextToken: string | undefined = accountRolesListResp.nextToken;
                while(nextToken) {
                    const listAccountRolesCommandPage: ListAccountRolesCommand = new ListAccountRolesCommand({
                        accessToken,
                        accountId: accountId,
                        nextToken: nextToken
                    });
                    const accountRolesListPageResp = await ssoClient.send(listAccountRolesCommandPage);
                    if(accountRolesListPageResp.roleList && accountRolesListPageResp.roleList.length > 0) {
                        roleList = roleList.concat(...accountRolesListPageResp.roleList.map(role => role.roleName as string));
                    }
                    nextToken = accountRolesListPageResp.nextToken;
                }
            }
            
            if(roleList.length === 1) {
                return roleList[0];
            }

            const rolePromptList = new promptList({
                name: 'role',
                message: `What role would you like to assume for account ${accountId}?`,
                choices: roleList
            });
            const selectedRole = await rolePromptList.run();
            console.log('selectedRole', selectedRole);
            return selectedRole;
        } else {
            throw "Could not find roles for acccount";
        }
    }
}
