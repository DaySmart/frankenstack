import { Context } from 'o18k-ts-aws';
import { IEntityObservation } from '../Entities/IEntityObservation';
import { PutUserMutation } from '../Entities/PutUserMutation';
import { User } from '../Entities/User';
import { createNewObservation, Observation2 } from '../Observation2';
const equal = require('deep-equal');

export default function UserDecider_PutUserMutationHandler(
	observation: Observation2<PutUserMutation.EntityObservation>,
	dependentObservations: Observation2<IEntityObservation>[][],
	_context: Context
): Observation2<User.EntityObservation>[] {
	const decisions: Observation2<IEntityObservation>[] = [];

	const dependentUserObservations = dependentObservations.find(observations =>
		observations.every(obs => obs.entity === User.ENTITY_NAME)
	) as Observation2<User.EntityObservation>[];

	const user: User.DataSchema = {
		UserId: observation.data.UserId,
		Email: observation.data.Email,
		PolicyNames: observation.data.Policies
	};

	if (dependentUserObservations.length > 0) {
		const previousUser = dependentUserObservations[0];
		if (previousUser.data.Email === user.Email && equal(previousUser.data.PolicyNames, user.PolicyNames)) {
			return decisions;
		}
		user.IdentityArn = previousUser.data.IdentityArn;
		user.Email = user.Email ? user.Email : previousUser.data.Email;
	}

	decisions.push(createNewObservation(User.EntityObservation, user, observation.traceid));

	return decisions;
}
