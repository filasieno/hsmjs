import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

type Cons = new () => TopState;

interface Protocol {
	transitionTo(s: Cons): void;
}

class TopState extends ihsm.TopState<ihsm.Ctx, Protocol> implements Protocol {
	transitionTo(s: Cons): void {
		this.transition(s);
	}
}

class A extends TopState {
	onEntry(): void {
		throw new Error('A fatal error');
	}
}

@ihsm.initialState
class B extends TopState {}

class C extends TopState {
	onExit(): void {
		throw new Error('A fatal error');
	}
}

function generateTest(traceLevel: ihsm.TraceLevel) {
	return function(): void {
		let sm: ihsm.Hsm<ihsm.Ctx, Protocol>;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel);
			sm = ihsm.create(TopState, {});
			await sm.sync();
		});

		it(`logs an error from the exit() callback and moves the state machine to the 'FatalErrorState' (traceLevel = ${traceLevel})`, async () => {
			expect(sm.currentState).equals(B);

			sm.post('transitionTo', C);
			await sm.sync();

			expect(sm.currentState).equals(C);
			sm.post('transitionTo', B);
			await sm.sync();

			expect(sm.currentState).equals(ihsm.FatalErrorState);
		});

		it(`logs an error from the entry() callback and moves the state machine to the 'FatalErrorState' (traceLevel = ${traceLevel})`, async () => {
			expect(sm.currentState).equals(B);

			sm.post('transitionTo', A);
			await sm.sync();

			expect(sm.currentState).equals(ihsm.FatalErrorState);
		});
	};
}

for (const traceLevel of [0, 1, 2]) {
	describe(`A transition that throws an error (traceLevel = ${traceLevel})`, generateTest(traceLevel as ihsm.TraceLevel));
}
