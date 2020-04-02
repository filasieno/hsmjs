import { expect } from 'chai';
import 'mocha';
import { TraceLevel, TraceWriter } from '../defs';
import * as ihsm from '../index';
import { createTestDispatchErrorCallback, clearLastError, TRACE_LEVELS } from './spec.utils';

type State = ihsm.State<Report>;

class Report {
	eventName?: string;
	eventPayload?: any[];
	traceHeader?: string;
	topState?: State;
	currentStateName?: string;
	currentState?: State;
	ctxTypeName?: string;
	traceLevel?: TraceLevel;
	topStateName?: string;
	traceWriter?: TraceWriter;
}

class TopState extends ihsm.BaseTopState<Report> {
	report(msg: string): void {
		console.log(`received message: ${msg}`);
		this.ctx.eventName = this.eventName;
		this.ctx.eventPayload = this.eventPayload;
		this.ctx.currentState = this.currentState;
		this.ctx.currentStateName = this.currentStateName;
		this.ctx.traceHeader = this.traceHeader;
		this.ctx.topState = this.topState;
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
	describe(`Fields (traceLevel = ${traceLevel})`, () => {
		let sm: ihsm.Hsm;

		beforeEach(async () => {
			ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());
			ihsm.configureTraceLevel(traceLevel as ihsm.TraceLevel);
			clearLastError();
		});

		it(`are available`, async () => {
			const ctx = new Report();
			sm = ihsm.create(TopState, ctx);
			sm.post('report', 'hello world');
			await sm.sync();
			expect(sm.currentStateName).eq('B');
			expect(ctx.eventName).eq('report');
			expect(ctx.eventPayload).eqls(['hello world']);
			expect(ctx.currentState).eq(B);
			expect(ctx.currentStateName).eq('B');
			expect(ctx.topState).eq(TopState);
			expect(ctx.ctxTypeName).eq('Report');
			expect(ctx.traceLevel).eq(traceLevel);
			expect(ctx.topStateName).eq('TopState');
			expect(ctx.traceWriter).instanceOf(ihsm.ConsoleTraceWriter);
		});
	});
}
