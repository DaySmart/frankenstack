import { IEntityObservation } from './Entities/IEntityObservation';

export class Observation2<T extends IEntityObservation>
implements IEntityObservation {
	constructor(params: ObservationParams<T>) {
		this.version = params.version as string;
		this.time = params.time as string;
		this.traceid = params.traceid as string;
		this.observer = params.observer as string;
		this.observerid = params.observerid as string;

		this.entityid = params.entityid;
		this.type = params.type;
		this.entity = params.entity;
		this.schema = params.schema;
		this.dataref = params.dataref;
		this.data = params.data;

		// have to have these directly for router/repository
		// how to have it so you can create obs easier for when mmaking decisions?
		//

		// this.entityid = params.entityObservation.entityid;
		// this.type = params.entityObservation.type;
		// this.entity = params.entityObservation.entity;
		// this.schema = params.entityObservation.schema;
		// this.dataref = params.entityObservation.dataref;
		// this.data = params.entityObservation.data;
	}

	time: string;
	version: string;
	traceid: string;
	observer: string;
	observerid: string;

	entityid: string;
	type: string;
	entity: string;
	schema: string;
	dataref: string;
	data: T['data'];
}

export interface ObservationParams<T extends IEntityObservation> {
	time?: string;
	version?: string;
	traceid?: string;
	observer?: string;
	observerid?: string;
	//entityObservation: T;
	entityid: string;
	type: string;
	entity: string;
	schema: string;
	dataref: string;
	data: T['data'];
}

export function createNewObservation<T extends IEntityObservation>(
	c: new (data: T['data']) => T,
	data: T['data'],
	traceid: string
): Observation2<T> {
	const entityObservation = new c(data);
	return new Observation2<T>({
		time: new Date().toISOString(),
		version: '0.1',
		observer: 'com.daysmart.environmentservice',
		observerid: 'sometypeofuri',
		traceid: generateTraceId(traceid),
		//entityObservation,
		entity: entityObservation.entity,
		type: entityObservation.type,
		entityid: entityObservation.entityid,
		schema: entityObservation.schema,
		dataref: entityObservation.dataref,
		data: entityObservation.data,
	});
}

export function createExistingObservation<T extends IEntityObservation>(
	entityObservation: T,
	traceid: string,
	time: string,
	version: string,
	observer: string,
	observerid: string
): Observation2<T> {
	return new Observation2<T>({
		time: time,
		version: version,
		observer: observer,
		observerid: observerid,
		traceid: traceid,
		entity: entityObservation.entity,
		type: entityObservation.type,
		entityid: entityObservation.entityid,
		schema: entityObservation.schema,
		dataref: entityObservation.dataref,
		data: entityObservation.data,
	});
}

export class Message {
	constructor(
		public observation: Observation2<any>,
		public destination: string
	) {}
}

export function generateTraceId(currentTraceId?: string): string {
	let traceRoot: string;
	let traceSpan: string;
	let traceSampled: string;
	let traceParent: string;

	if (currentTraceId) {
		traceRoot = currentTraceId.split('-')[0];
		traceSpan = getRanHex(16);
		traceSampled = '1';
		traceParent = currentTraceId.split('-')[1];
	} else {
		traceRoot = getRanHex(32);
		traceSpan = getRanHex(16);
		traceSampled = '1';
		traceParent = '0000000000000000';
	}
	return traceRoot + '-' + traceSpan + '-' + traceSampled + '-' + traceParent;
}

const getRanHex = (size) => {
	const result: string[] = [];
	const hexRef = [
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'a',
		'b',
		'c',
		'd',
		'e',
		'f',
	];

	for (let n = 0; n < size; n++) {
		result.push(hexRef[Math.floor(Math.random() * 16)]);
	}
	return result.join('');
};
