import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';
import { TRACE_LEVELS } from './trace.setup';

interface Protocol {
	hello(): void;
	transitionTo(s: State): void;
}

type State = ihsm.State<ihsm.Any, Protocol>;

class TopState extends ihsm.TopState<ihsm.Any, Protocol> {
	onUnhandled<EventName extends keyof Protocol>(error: ihsm.UnhandledEventError<ihsm.Any, Protocol, EventName>): Promise<void> | void {
		if (this.currentState === A) {
			this.transition(B);
		} else {
			this.transition(A);
		}
	}

	transitionTo(s: ihsm.State<ihsm.Any, Protocol>): void {
		this.transition(s);
	}
}

class A extends TopState {
	hello() {
		this.unhandled();
	}
}

@ihsm.initialState
class B extends TopState {}

for (const traceLevel of TRACE_LEVELS) {
	describe(`An unhandled event (traceLevel = ${traceLevel})`, function(): void {
		let sm: ihsm.Hsm<ihsm.Any, Protocol>;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel as ihsm.TraceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel as ihsm.TraceLevel);
			sm = ihsm.create(TopState, {});
			await sm.sync();
		});

		it(`calls onUnhandledEvent`, async () => {
			sm.post('hello');
			await sm.sync();
			expect(sm.currentState).equals(A);
		});

		it(`calls onUnhandledEvent, when an event handler calls unhandled()`, async () => {
			sm.post('transitionTo', A);
			sm.post('hello');
			await sm.sync();
			expect(sm.currentState).equals(B);
		});
	});
}
