import * as ihsm from '../index';

interface Protocol {
	writeMessage(): void;
	asyncWriteMessage(): Promise<void>;
	setMessage(msg: string): void;
}

class Data {
	msg!: string;
}

class TopState extends ihsm.BaseTopState<Data, Protocol> {
	onEntry(): void {
		this.ctx.msg = 'initial message';
	}

	writeMessage(): void {
		this.transition(B);
	}

	asyncWriteMessage(): void {
		this.transition(A);
	}
	setMessage(msg: string): void {
		this.ctx.msg = msg;
	}
}

@ihsm.initialState
class A extends TopState {}

class B extends TopState {}

async function main(): Promise<void> {
	ihsm.configureTraceLevel(ihsm.TraceLevel.VERBOSE_DEBUG);
	const hsm = ihsm.create(TopState, new Data(), true);
	await hsm.sync();
	console.log(`>> main: current state name: ${hsm.currentStateName}`);
	hsm.post('setMessage', 'hello');
	hsm.post('writeMessage');
	hsm.post('asyncWriteMessage');
	await hsm.sync();
}

(async (): Promise<void> => {
	try {
		await main();
	} catch (e) {
		console.log(e);
	}
})();
