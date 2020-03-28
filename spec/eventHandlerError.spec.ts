import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

interface Protocol {
	executeWithError01(): void;
	executeWithError02(): void;
}

class TopStateRecovery extends ihsm.TopState<ihsm.Ctx, Protocol> {
	async onError<EventName extends keyof Protocol>(err: ihsm.EventHandlerError<ihsm.Ctx, Protocol, EventName>): Promise<void> {
		console.log(err);
		switch (err.eventName) {
			case 'executeWithError01':
				return;
			case 'executeWithError02':
				this.transition(B);
				return;
		}
		await this.sleep(1000);
	}

	executeWithError01(): void {
		throw new Error('error 01');
	}

	executeWithError02(): void {
		throw new Error('error 01');
	}
}

class B extends TopStateRecovery {}

function generateTest(traceLevel: ihsm.TraceLevel) {
	return function(): void {
		let sm: ihsm.Hsm<Record<string, any>, Protocol>;

		beforeEach(async () => {
			console.log(`Current trace level: ${traceLevel}`);
			ihsm.configureHsmTraceLevel(traceLevel);
			sm = ihsm.create(TopStateRecovery, {});
			await sm.sync();
		});

		it(`recovers a number error`, async () => {
			expect(sm.currentState).equals(TopStateRecovery);
			sm.post('executeWithError01');
			await sm.sync();
			await sm.post('executeWithError02');
			await sm.sync();
			expect(sm.currentStateName).equals('B');
		});

		it(`recovers a string error`, async () => {
			expect(sm.currentState).equals(TopStateRecovery);
		});
	};
}

for (const traceLevel of [0, 1, 2]) {
	describe(`A message handler throws an error (traceLevel = ${traceLevel})`, generateTest(traceLevel));
}
