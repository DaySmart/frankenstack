import { Observation2 } from 'o18k-ts-aws';
import { Policy } from '../../generated/Entities/Policy';
const micromatch = require('micromatch');

export function validateActionAllowedByPolicies(
	action: string,
	environment: string,
	componentName: string,
	policies: Observation2<Policy.EntityObservation>[]
): boolean {
	const statements = parseStatementsFromPolicyObservations(policies);
	if(isActionDenied(action, `${environment}:${componentName}`, statements)) {
		return false;
	}
	if(isActionAllowed(action, `${environment}:${componentName}`, statements)) {
		return true;
	} else {
		return false;
	}
}

function parseStatementsFromPolicyObservations(policies: Observation2<Policy.EntityObservation>[]): Array<Policy.Statement> {
	const statements: Array<Policy.Statement> = [];
	if(policies.length === 0) {
		// Default policy
		return [
			{
				Effect: 'Deny',
				Actions: ['deploy:write'],
				Resources: ['prod*']
			},
			{
				Effect: 'Deny',
				Actions: ['secrets:*'],
				Resources: ['*']
			},
			{
				Effect: 'Allow',
				Actions: ['*'],
				Resources: ['*']
			}
		];
	}
	policies.forEach(policy => {
		statements.push(...policy.data.Statements);
	});
	return statements;
}

function isActionDenied(action: string, componentName: string, statements: Array<Policy.Statement>): boolean {
	for(const statement of statements) {
		if(statement.Effect === 'Deny') {
			if(micromatch.isMatch(action, statement.Actions) && micromatch.isMatch(componentName, statement.Resources)) {
				return true;
			}
		}
	}
	return false;
}

function isActionAllowed(action: string, componentName: string, statements: Array<Policy.Statement>): boolean {
	for(const statement of statements) {
		if(statement.Effect === 'Allow') {
			if(micromatch.isMatch(action, statement.Actions) && micromatch.isMatch(componentName, statement.Resources)) {
				return true;
			}
		}
	}
	return false;
}