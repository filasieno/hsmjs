import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';
import { TRACE_LEVELS } from './trace.setup';

type Cons = new () => TopState;

interface Protocol {
	transitionTo(s: Cons): void;
}

class TopState extends ihsm.TopState<ihsm.Any, Protocol> implements Protocol {
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

for (const traceLevel of TRACE_LEVELS) {
	describe(`A transition that throws an error (traceLevel = ${traceLevel})`, function(): void {
		let sm: ihsm.Hsm<ihsm.Any, Protocol>;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel as ihsm.TraceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel as ihsm.TraceLevel);
			sm = ihsm.create(TopState, {});
			await sm.sync();
		});

		it(`logs an error from the exit() callback and moves the state machine to the 'FatalErrorState' (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			expect(sm.currentState).equals(B);

			sm.post('transitionTo', C);
			await sm.sync();

			expect(sm.currentState).equals(C);
			sm.post('transitionTo', B);
			await sm.sync();

			expect(sm.currentState).equals(ihsm.FatalErrorState);
		});

		it(`logs an error from the entry() callback and moves the state machine to the 'FatalErrorState' (traceLevel = ${traceLevel as ihsm.TraceLevel})`, async () => {
			expect(sm.currentState).equals(B);

			sm.post('transitionTo', A);
			await sm.sync();

			expect(sm.currentState).equals(ihsm.FatalErrorState);
		});
	});
}
