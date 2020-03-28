import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

class TopState extends ihsm.TopState {}
@ihsm.initialState
class A extends TopState {}
@ihsm.initialState
class B extends A {
	onEntry(): void {
		throw new Error('Error during initialization');
	}
}

function generateTest(traceLevel: ihsm.TraceLevel) {
	return function(): void {
		let sm: ihsm.Hsm;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel);
		});

		it(`moves the state machine to FatalErrorState`, async () => {
			sm = ihsm.create(TopState, {});
			await sm.sync();
			expect(sm.currentStateName).equals('FatalErrorState');
		});
	};
}

for (const traceLevel of [0, 1, 2]) {
	describe(`Initialization failure (traceLevel = ${traceLevel})`, generateTest(traceLevel as ihsm.TraceLevel));
}
