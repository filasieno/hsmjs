import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';
import { createTestDispatchErrorCallback, getLastError, TRACE_LEVELS } from './spec.utils';

ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());

interface Protocol {
	hello(): void;
	transitionTo(s: State): void;
}

type State = ihsm.State<ihsm.Any, Protocol>;

class TopState extends ihsm.BaseTopState<ihsm.Any, Protocol> {
	onUnhandled<EventName extends keyof Protocol>(error: ihsm.UnhandledEventError<ihsm.Any, Protocol, EventName>): Promise<void> | void {
		if (this.currentState === A) {
			this.transition(B);
		} else {
			this.transition(A);
		}

		if (this.currentState === F) {
			this.transition(E);
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

class C extends TopState {
	onUnhandled<EventName extends keyof Protocol>(error: ihsm.UnhandledEventError<ihsm.Any, Protocol, EventName>): Promise<void> | void {
		throw new Error('Unhandled throws');
	}
}

class E extends TopState {
	onEntry(): Promise<void> | void {
		throw new Error('Unhandled throws in a transition');
	}
}

class F extends TopState {}

class G extends TopState {
	onError<EventName extends keyof Protocol>(error: ihsm.RuntimeError<ihsm.Any, Protocol, EventName>): Promise<void> | void {
		console.log('recovered');
	}

	onUnhandled<EventName extends keyof Protocol>(error: ihsm.UnhandledEventError<ihsm.Any, Protocol, EventName>): Promise<void> | void {
		throw new Error('Error to recover');
	}
}

class H extends TopState {
	hello() {
		this.unhandled();
	}

	onError<EventName extends keyof Protocol>(error: ihsm.RuntimeError<ihsm.Any, Protocol, EventName>): Promise<void> | void {
		throw new Error('Fail now');
	}

	onUnhandled<EventName extends keyof Protocol>(error: ihsm.UnhandledEventError<ihsm.Any, Protocol, EventName>): Promise<void> | void {
		throw new Error('Error to recover');
	}
}

@ihsm.initialState
class B extends TopState {}

for (const traceLevel of TRACE_LEVELS) {
	describe(`An unhandled event (traceLevel = ${traceLevel})`, function(): void {
		let sm: ihsm.Hsm<ihsm.Any, Protocol>;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel as ihsm.TraceLevel}`);
			ihsm.configureTraceLevel(traceLevel as ihsm.TraceLevel);
			ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback(true));
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

		it(`throws in an onUnhandled()`, async () => {
			sm.post('transitionTo', C);
			sm.post('hello');
			await sm.sync();
			expect(sm.currentState).equals(ihsm.FatalErrorState);
			expect(getLastError()).instanceOf(ihsm.RuntimeError);
		});

		it(`throws in a transition after onUnhandled()`, async () => {
			sm.post('transitionTo', F);
			sm.post('hello');
			await sm.sync();
			expect(sm.currentState).equals(ihsm.FatalErrorState);
			expect(getLastError()).instanceOf(ihsm.RuntimeError);
		});

		it(`throws and recovers`, async () => {
			sm.post('transitionTo', G);
			sm.post('hello');
			await sm.sync();
			expect(sm.currentState).equals(G);
			expect(getLastError()).instanceOf(ihsm.RuntimeError);
		});

		it(`throws, and it does not recover in a user marked unhandled`, async () => {
			sm.post('transitionTo', H);
			sm.post('hello');
			await sm.sync();
			expect(sm.currentState).equals(ihsm.FatalErrorState);
			expect(getLastError()).instanceOf(ihsm.RuntimeError);
		});
	});
}
