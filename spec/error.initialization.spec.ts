import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';
import { TRACE_LEVELS } from './trace.setup';

class TopState extends ihsm.TopState {}
@ihsm.initialState
class A extends TopState {}
@ihsm.initialState
class B extends A {
	onEntry(): void {
		throw new Error('Error during initialization');
	}
}

for (const traceLevel of TRACE_LEVELS) {
	describe(`Initialization failure (traceLevel = ${traceLevel})`, function(): void {
		let sm: ihsm.Hsm;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel as ihsm.TraceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel as ihsm.TraceLevel);
		});

		it(`moves the state machine to FatalErrorState`, async () => {
			sm = ihsm.create(TopState, {});
			await sm.sync();
			expect(sm.currentStateName).equals('FatalErrorState');
		});
	});
}
