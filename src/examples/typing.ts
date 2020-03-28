import * as ihsm from '../index';

interface Protocol {
	writeMessage(): void;
	asyncWriteMessage(): Promise<void>;
	setMessage(msg: string): void;
}

class Data {
	msg!: string;
}

class TopState extends ihsm.TopState<Data, Protocol> {
	onEntry(): void {
		this.ctx.msg = 'initial message';
	}

	writeMessage(): void {
		this.trace(`${this.ctx.msg}`);
		this.transition(B);
	}

	asyncWriteMessage(): void {
		this.trace(`${this.ctx.msg}`);
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
	ihsm.configureHsmTraceLevel(ihsm.TraceLevel.ALL);
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
