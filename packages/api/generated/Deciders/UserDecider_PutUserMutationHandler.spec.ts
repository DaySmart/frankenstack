import { createNewObservation, generateTraceId, Observation2, } from '../Observation2';
import handler from './UserDecider_PutUserMutationHandler';
import { PutUserMutation } from '../Entities/PutUserMutation';
import { User } from '../Entities/User';

describe('UserDecider_PutUserMutationHandler', () => {

	it('Component', () => {
		const putUserMutation = createNewObservation<PutUserMutation.EntityObservation>(PutUserMutation.EntityObservation,
			{
				Email: 'test@email.com',
				UserId: 'test.id',
				Policies:  ['policyname']
			}, generateTraceId()
		);

		const resp: Observation2<User.EntityObservation>[] = handler(putUserMutation, [[]], { time: new Date() });

		expect(resp[0].entity).toEqual(User.ENTITY_NAME);
		expect(resp[0].data.Email).toEqual('test@email.com');
		expect(resp[0].data.UserId).toEqual('test.id');
		expect(resp[0].data.PolicyNames.length).toEqual(1);
		expect(resp[0].data.PolicyNames[0]).toEqual('policyname');
	});
});
