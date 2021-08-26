import { createNewObservation, generateTraceId, Observation2, } from "../Observation2";
import handler from './PolicyDecider_PutPolicyMutationHandler';
import { PutPolicyMutation } from "../Entities/PutPolicyMutation";
import { Policy } from "../Entities/Policy";

describe('PolicyDecider_PutPolicyMutationHandler', () => {

	it('Component', () => {
    const putPolicyMutation = createNewObservation<PutPolicyMutation.EntityObservation>(PutPolicyMutation.EntityObservation,
      {
        Statements: [
          {
            Effect: 'Allow',
            Actions: ['*'],
            Resources: ['*']
          }
        ],
        PolicyName: 'test'
      }, generateTraceId()
    );

		const resp: Observation2<Policy.EntityObservation>[] = handler(putPolicyMutation, [[]], { time: new Date() });

		expect(resp[0].entity).toEqual(Policy.ENTITY_NAME);
    expect(resp[0].data.PolicyName).toEqual('test');
    expect(resp[0].data.Statements.length).toEqual(1);
    expect(resp[0].data.Statements[0].Effect).toEqual('Allow');
    expect(resp[0].data.Statements[0].Actions[0]).toEqual('*');
    expect(resp[0].data.Statements[0].Resources[0]).toEqual('*');
  });
})
