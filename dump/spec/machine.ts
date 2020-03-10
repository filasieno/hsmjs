import * as ihsm from '../ihsm/ihsm';

export class Demo {
    counter: number = 0;
    message?: string;
}

export namespace Machine {

    export class State extends ihsm.State<State, Demo> {
        setMessage(msg: string): void { return this.hsm.unhandled() }
        tick(): void { this.hsm.unhandled() }
        changeState(s: new () => State): void { this.hsm.transition(s); }
        async sendBack(value: any): Promise<any> { return value }
        async _entry() {}
        async _exit() {}
    }

    @ihsm.errorState
    export class ErrorState extends State {
        async onError(err: Error) {
            this.hsm.logError(err);
        }
    }

    @ihsm.initialState
    export class State1 extends State {
        setMessage(msg: string): void { this.ctx.message = "I was set by State1" }
        tick() {
            this.ctx.message = "State1 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
        _init() {}
        async _entry() {}
        async _exit() {}
    }

    export class State11 extends State1 {
        tick() {
            this.ctx.message = "State11 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
        async _entry() {}
        async _exit() {}
    }

    @ihsm.initialState
    export class State12 extends State1 {
        _init() {}
        tick() {
            this.ctx.message = "State11 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
    }

    @ihsm.initialState
    export class State112 extends State12 {
        _init() {}
        tick(): void {
            this.ctx.message = "State112 was here";
            ++this.ctx.counter;
            this.hsm.transition(State1);
        }
        async _entry() {}
        async _exit() {}
    }

    export class State2 extends State {
    }

}
