import { parseArn } from '@unbounce/parse-aws-arn';

export default function(event: any): string {
	const userArn = event.identity.userArn;
	const arn = parseArn(userArn);

	if(arn.resourceType === 'user') {
		return arn.resourceId as string;
	} else if(arn.resourceType === 'assumed-role') {
		const resourceId = arn.resourceId?.split('/');
		if(resourceId && resourceId[0].includes('jenkins')) {
			return 'jenkins';
		} else if(resourceId && resourceId[1]) {
			return resourceId[1];
		}
	}
	return 'unauthenticated';
}