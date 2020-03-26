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
class A extends ihsm.TopState {
	_entry(): void {
		new Error('A fatal error');
	}
}

@ihsm.initialState
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class B extends TopState implements Protocol {}

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
		it(`moves the state machine to the 'FatalErrorState' (traceLevel = ${traceLevel})`, async () => {});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`sent by a post() call eat the error`, async () => {});

		// eslint-disable-next-line @typescript-eslint/no-empty-function
		it(`sent by a send() will throw the error to the send caller`, async () => {});
	};
}

for (const traceLevel of Object.values(ihsm.TraceLevel)) {
	describe(`A transition that throws an error (traceLevel = ${traceLevel})`, generateTransitionTest(traceLevel as ihsm.TraceLevel));
}
