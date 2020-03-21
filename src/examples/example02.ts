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

import * as ihsm from "../index";
import { LogLevel } from "../index";

interface Protocol {
    changeColor(newColor: string): void;
    shutdown(): void;
    startUp(): void;
    sample(): void;
}

class LightMachine extends ihsm.TopState<{[key: string]: any}, Protocol> {
    changeColor(newColor: string): void { this.ctx.color = newColor; }
    shutdown() { this.transition(SystemOff) }
    startUp() { this.transition(SystemOn) }
    sample() { console.log("LightMachine") }

    _init(): void { this.ctx.color = 'white'}
    _entry() {}
    _exit() {}
    x = 10;
}


class SystemOn extends LightMachine {
    sample() {
        console.log("SystemOn")
    }
    _entry() {}
    _exit() {}//
    getReport(): string { return `the state of the light is "${this.currentStateName}" is on and it's color is ${this.ctx.color}`}
}

@ihsm.initialState
class SystemOff extends LightMachine {
    sample() {
        console.log("SystemOff")
    }
    _entry() {}
    _exit() {}
    switch(): void {
        this.sample();
        this.logInfo("The system is off; cannot execute #switch")
    }
}

class LightOn extends SystemOn {
    sample() {
        console.log("LightOn")
    }
    switch(): void {
        this.sample();
        this.transition(LightOff);
    }
    _entry() {}
    _exit() {}
}

@ihsm.initialState
class LightOff extends SystemOn {
    sample() {
        console.log("LightOff")
    }
    switch(): void {
        this.transition(LightOn);
    }
    _entry() {}
    _exit() {}
}


async function main() {
    try {
        ihsm.configureLogLevel(LogLevel.DEBUG);
        let sm = ihsm.create(LightMachine, {});
        sm.post('startUp');
        sm.post('shutdown');

        sm.post('startUp');
        sm.post('changeColor', 'red');
        sm.post('switch');
        sm.post('switch');
        sm.post('shutdown');
        await sm.done();
    } catch (err) {
        console.log(err);
    }

}

Promise.resolve().then(main);
