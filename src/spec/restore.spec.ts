import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../index';
import { clearLastError, TRACE_LEVELS } from './spec.utils';
import { createTestDispatchErrorCallback } from './spec.utils';
ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());

class TopState extends ihsm.BaseTopState {
	getValue(obj: { value: string }): void {
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
			ihsm.configureTraceLevel(traceLevel as ihsm.TraceLevel);
			clearLastError();
		});

		it(`sets the current state and the current context`, async () => {
			const initial = { value: 'initial' };
			const first = { value: 'first' };
			const second = { value: 'second' };

			const hsm = ihsm.create(TopState, initial, false);
			const query: ihsm.Any = { value: undefined };
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
