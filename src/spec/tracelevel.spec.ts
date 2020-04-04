import { expect } from 'chai';
import 'mocha';
import { HsmFactory, Hsm, HsmInitialState, HsmTopState, HsmTraceLevel, HsmAny } from '../';

interface Protocol {
	switchTraceLevel(tl: HsmTraceLevel): Promise<void>;
	hello(): void;
}

class TopState extends HsmTopState<HsmAny, Protocol> {
	async switchTraceLevel(tl: HsmTraceLevel): Promise<void> {
		console.log(`new trace level = ${HsmTraceLevel[tl]}`);
		this.traceLevel = tl;
	}

	hello(): void {
		console.log(`Hello: TraceLevel = ${HsmTraceLevel[this.traceLevel]}`);
	}
}

@HsmInitialState
class A extends TopState {}
@HsmInitialState
class B extends A {}
@HsmInitialState
class C extends B {}
@HsmInitialState
class D extends C {}
@HsmInitialState
class E extends D {}
@HsmInitialState
class F extends E {}

describe(`Switch TraceLevel`, function(): void {
	let sm: Hsm<HsmAny, Protocol>;
	const factory = new HsmFactory(TopState);

	beforeEach(async () => {
		factory.traceLevel = HsmTraceLevel.VERBOSE_DEBUG;
		sm = factory.create({});
		await sm.sync();
	});

	it(`trace level switch`, async () => {
		expect(sm.currentState).eqls(F);

		sm.post('switchTraceLevel', HsmTraceLevel.VERBOSE_DEBUG);
		await sm.sync();

		console.log('>>>');
		sm.post('hello');
		await sm.sync();
		console.log('<<<');

		sm.post('switchTraceLevel', HsmTraceLevel.DEBUG);
		await sm.sync();

		console.log('>>>');
		sm.post('hello');
		await sm.sync();
		console.log('<<<');

		sm.post('switchTraceLevel', HsmTraceLevel.PRODUCTION);
		await sm.sync();

		console.log('>>>');
		sm.post('hello');
		await sm.sync();
		console.log('<<<');
	});
});
