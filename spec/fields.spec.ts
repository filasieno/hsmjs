import { expect } from 'chai';
import 'mocha';
import { TraceLevel, TraceWriter } from '../src/index';
import * as ihsm from '../src/index';
import { TRACE_LEVELS } from './trace.setup';

type State = ihsm.State<Report>;

class Report {
	eventName?: string;
	eventPayload?: any[];
	traceContextLevel?: number;
	traceHeader?: string;
	topState?: State;
	currentStateName?: string;
	currentState?: State;
	ctxTypeName?: string;
	id?: number;
	traceLevel?: TraceLevel;
	topStateName?: string;
	traceWriter?: TraceWriter;
}

class TopState extends ihsm.TopState<Report> {
	report(msg: string): void {
		this.trace(msg);
		this.ctx.eventName = this.eventName;
		this.ctx.eventPayload = this.eventPayload;
		this.ctx.currentState = this.currentState;
		this.ctx.currentStateName = this.currentStateName;
		this.ctx.traceContextLevel = this.traceContextLevel;
		this.ctx.traceHeader = this.traceHeader;
		this.ctx.topState = this.topState;
		this.ctx.id = this.id;
		this.ctx.ctxTypeName = this.ctxTypeName;
		this.ctx.traceLevel = this.traceLevel;
		this.ctx.topStateName = this.topStateName;
		this.ctx.traceWriter = this.traceWriter;
	}
}
@ihsm.initialState
class A extends TopState {}
@ihsm.initialState
class B extends A {}

for (const traceLevel of TRACE_LEVELS) {
	describe(`Initialization failure (traceLevel = ${traceLevel})`, () => {
		let sm: ihsm.Hsm;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel as ihsm.TraceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel as ihsm.TraceLevel);
		});

		it(`checks all TraceBoundHsm fields`, async () => {
			const ctx = new Report();
			ihsm.resetId();
			sm = ihsm.create(TopState, ctx);
			sm.post('report', 'hello world');
			await sm.sync();
			expect(sm.currentStateName).eq('B');
			expect(ctx.eventName).eq('report');
			expect(ctx.eventPayload).eqls(['hello world']);
			expect(ctx.currentState).eq(B);
			expect(ctx.currentStateName).eq('B');
			expect(ctx.traceContextLevel).eq(1);
			expect(ctx.traceHeader).eq('Report|10000000|    B');
			expect(ctx.topState).eq(TopState);
			expect(ctx.id).eq(10000000);
			expect(ctx.ctxTypeName).eq('Report');
			expect(ctx.traceLevel).eq(traceLevel);
			expect(ctx.topStateName).eq('TopState');
			expect(ctx.traceWriter).instanceOf(ihsm.ConsoleTraceWriter);
		});
	});
}
