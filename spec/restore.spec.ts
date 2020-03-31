import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';
import { TRACE_LEVELS } from './spec.utils';
import { createTestDispatchErrorCallback } from './spec.utils';
ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());

class TopState extends ihsm.BaseTopState {
	getValue(obj: { value: string }) {
		obj.value = this.ctx.value;
	}
}
@ihsm.initialState
class A extends TopState {}
@ihsm.initialState
class B extends A {}

class C extends TopState {}

for (const traceLevel of TRACE_LEVELS) {
	describe(`Restore (traceLevel = ${traceLevel})`, () => {
		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel as ihsm.TraceLevel}`);
			ihsm.configureTraceLevel(traceLevel as ihsm.TraceLevel);
		});

		it(`sets the current state and the current context`, async () => {
			let initial = { value: 'initial' };
			let first = { value: 'first' };
			let second = { value: 'second' };

			let hsm = ihsm.create(TopState, initial, false);
			let query: ihsm.Any = { value: undefined };
			hsm.post('getValue', query);
			await hsm.sync();
			expect(query.value).equals(initial.value);
			expect(hsm.currentState).equals(TopState);

			hsm.restore(TopState, B, first);
			hsm.post('getValue', query);
			await hsm.sync();
			expect(query.value).equals(first.value);
			expect(hsm.currentState).equals(B);

			hsm.restore(TopState, C, second);
			hsm.post('getValue', query);
			await hsm.sync();
			expect(query.value).equals(second.value);
			expect(hsm.currentState).equals(C);
		});
	});
}