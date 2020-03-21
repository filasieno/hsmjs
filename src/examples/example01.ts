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

class LightMachine extends ihsm.TopState {
	changeColor(newColor: string): void {
		this.ctx.color = newColor;
	}
	_init(): void {
		this.ctx.color = 'white';
	}
	async wait(): Promise<void> {
		await this.sleep(1000);
	}
}

class LightOn extends LightMachine {
	switch(): void {
		this.transition(LightOff);
	}
	getReport(): string {
		return `the light is on and it's color is ${this.ctx.color}`;
	}
}

@ihsm.initialState
class LightOff extends LightMachine {
	_entry(): void {
		this.logInfo('entry');
	}
	switch(): void {
		this.transition(LightOn);
	}
	getReport(): string {
		return `the light is off and it's color is ${this.ctx.color}`;
	}
}

async function main(): Promise<void> {
	try {
		ihsm.configureLogLevel(ihsm.LogLevel.INFO);
		const sm = ihsm.create(LightMachine, {});
		sm.post('changeColor', 'red');
		sm.post('switch');
		sm.post('switch');
		sm.post('wait');
		sm.post('wait');
		sm.post('wait');
		await sm.done();
	} catch (err) {
		console.log(err);
	}
}

Promise.resolve().then(main);
