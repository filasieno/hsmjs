import { expect } from 'chai';
import 'mocha';
import { InitializationError } from '../index';
import * as ihsm from '../index';
import { clearLastError, createTestDispatchErrorCallback, getLastError, TRACE_LEVELS } from './spec.utils';

class TopState extends ihsm.BaseTopState {}
@ihsm.initialState
class A extends TopState {}
@ihsm.initialState
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class B extends A {
	onEntry(): void {
		throw new Error('Error during initialization');
	}
}

for (const traceLevel of TRACE_LEVELS) {
	describe(`Initialization failure (traceLevel = ${traceLevel})`, function(): void {
		let sm: ihsm.Hsm;

		beforeEach(async () => {
			ihsm.configureTraceLevel(traceLevel as ihsm.TraceLevel);
			ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback(true));
			clearLastError();
		});

		it(`moves the state machine to FatalErrorState`, async () => {
			sm = ihsm.create(TopState, {});
			await sm.sync();
			expect(sm.currentStateName).equals('FatalErrorState');
			expect(getLastError()).instanceOf(InitializationError);
		});
	});
}
