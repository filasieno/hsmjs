// import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

type Cons = new () => TopState;

interface Protocol {
	hello(): void;
}

class TopState extends ihsm.TopState<ihsm.Ctx, Protocol> implements Protocol {
	hello(): void {
		this.unhandled();
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class A extends TopState {
	hello() {
		this.trace('hello');
	}
}

@ihsm.initialState
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class B extends TopState {}

function generateTransitionTest(traceLevel: ihsm.TraceLevel) {
	return function(): void {
		let sm: ihsm.Hsm<ihsm.Ctx, Protocol>;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel);
			sm = ihsm.create(TopState, {});
			await sm.sync();
		});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`gets a last chance to catch the event`, async () => {
			sm.post('hello');
		});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`if uncaught throws an EventHandler exception and moves the state machine to FatalErrorState`, async () => {});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`if uncaught in a post the error will be eaten`, async () => {});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`if uncaught in a send the error will be eaten`, async () => {});
	};
}

for (const traceLevel of [0, 1, 2]) {
	describe(`A unhandled event (traceLevel = ${traceLevel})`, generateTransitionTest(traceLevel as ihsm.TraceLevel));
}
