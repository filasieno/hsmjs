// import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

type Cons = new () => TopState;

interface Protocol {
	transitionTo(s: Cons): void;
}

class TopState extends ihsm.TopStateWithProtocol<Protocol> implements Protocol {
	transitionTo(s: Cons): void {
		this.transition(s);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class A extends TopState {
	_entry(): void {
		new Error('A fatal error');
	}
	_exit(): void {
		this.ctx.exitList.push(A);
	}
}

@ihsm.initialState
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class B extends TopState {}

function generateTransitionTest(traceLevel: ihsm.TraceLevel) {
	return function(): void {
		let sm: ihsm.HsmWithProtocol<Protocol>;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel);
			sm = ihsm.createHsm(TopState, {});
			await sm.sync();
		});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`gets a last chance to catch the event`, async () => {});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`if uncaught throws an EventHandler exception and moves the state machine to FatalErrorState`, async () => {});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`if uncaught in a post the error will be eaten`, async () => {});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`if uncaught in a send the error will be eaten`, async () => {});
	};
}

for (const traceLevel of Object.values(ihsm.TraceLevel)) {
	describe(`A unhandled event (traceLevel = ${traceLevel})`, generateTransitionTest(traceLevel as ihsm.TraceLevel));
}
