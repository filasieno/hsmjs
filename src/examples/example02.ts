import * as ihsm from '../index';
import { TraceLevel } from '../index';

interface Protocol {
	changeColor(newColor: string): void;
	shutdown(): void;
	startUp(): void;
	sample(): void;
	switch(): void;
}

class LightMachine extends ihsm.TopStateWithProtocol<Protocol> {
	changeColor(newColor: string): void {
		this.ctx.color = newColor;
	}
	shutdown(): void {
		this.transition(SystemOff);
	}
	startUp(): void {
		this.transition(SystemOn);
	}
	sample(): void {
		console.log('sample');
	}
	_init(): void {
		this.ctx.color = 'white';
	}
	_entry(): void {
		console.log('entry');
	}
	_exit(): void {
		console.log('exit');
	}
}

class SystemOn extends LightMachine {
	sample(): void {
		console.log('>>>>>> SystemOn');
	}
	_entry(): void {
		console.log('entry');
	}
	_exit(): void {
		console.log('entry');
	}
	getReport(): string {
		return `the state of the light is "${this.currentStateName}" is on and it's color is ${this.ctx.color}`;
	}
}

@ihsm.initialState
class SystemOff extends LightMachine {
	sample(): void {
		console.log('>>>>>> SystemOff');
	}
	_entry(): void {
		console.log('entry');
	}
	_exit(): void {
		console.log('exit');
	}
	switch(): void {
		this.sample();
		console.log('The system is off; cannot execute #switch');
	}
}

class LightOn extends SystemOn {
	sample(): void {
		console.log('>>>>>> LightOn');
	}
	switch(): void {
		this.sample();
		this.transition(LightOff);
	}
	_entry(): void {
		console.log('entry');
	}
	_exit(): void {
		console.log('exit');
	}
}

@ihsm.initialState
class LightOff extends SystemOn {
	sample(): void {
		console.log('>>>>>> LightOff');
	}
	switch(): void {
		this.sample();
		this.transition(LightOn);
	}
	_entry(): void {
		console.log('entry');
	}
	_exit(): void {
		console.log('exit');
	}
}

async function main(): Promise<void> {
	try {
		ihsm.configureHsmTraceLevel(TraceLevel.ALL);
		const sm = ihsm.createHsm(LightMachine, {});
		sm.post('startUp');
		sm.post('switch');
		sm.post('switch');
		sm.post('switch');
		await sm.sync();
	} catch (err) {
		console.log(err);
	}
}

Promise.resolve().then(main);
