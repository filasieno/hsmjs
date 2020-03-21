// ---------------------------------------------------------------------------------------------------------------------
//
//
//
//
//
//
//
//
//
//
//
//
//
// author: Fabio N. Filasieno
// ---------------------------------------------------------------------------------------------------------------------

import * as ihsm from '../index';

interface IProtocol {
	changeColor(newColor: string): void;
	shutdown(): void;
	startUp(): void;
	sample(): void;
}

class LightMachine extends ihsm.TopState<ihsm.Any, IProtocol> {
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
		this.logInfo('>>>>>> LightMachine');
	}
	_init(): void {
		this.ctx.color = 'white';
	}
	_entry(): void {
		this.logInfo('entry');
	}
	_exit(): void {
		this.logInfo('exit');
	}
	x = 10;
}

class SystemOn extends LightMachine {
	sample(): void {
		console.log('>>>>>> SystemOn');
	}
	_entry(): void {
		this.logInfo('entry');
	}
	_exit(): void {
		this.logInfo('entry');
	}
	getReport(): string {
		return `the state of the light is "${this.currentStateName}" is on and it's color is ${this.ctx.color}`;
	}
}

@ihsm.initialState
class SystemOff extends LightMachine {
	sample(): void {
		this.logInfo('>>>>>> SystemOff');
	}
	_entry(): void {
		this.logInfo('entry');
	}
	_exit(): void {
		this.logInfo('exit');
	}
	switch(): void {
		this.sample();
		this.logInfo('The system is off; cannot execute #switch');
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
		this.logInfo('entry');
	}
	_exit(): void {
		this.logInfo('exit');
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
		this.logInfo('entry');
	}
	_exit(): void {
		this.logInfo('exit');
	}
}

async function main(): Promise<void> {
	try {
		ihsm.configureLogLevel(ihsm.LogLevel.DEBUG);
		const sm = ihsm.create(LightMachine, {});
		sm.post('startUp');
		sm.post('switch');
		sm.post('switch');
		sm.post('switch');
		await sm.done();
	} catch (err) {
		console.log(err);
	}
}

Promise.resolve().then(main);
