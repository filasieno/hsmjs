import * as ihsm from '../ihsm';

export class Demo {
    counter: number = 0;
    message?: string;
}

export namespace Machine {

    type IO = ihsm.IO<Demo>;

    export interface Protocol {
        setMessage(msg: string): IO;
        tick(): IO;
    }

    export class TopState extends ihsm.State<Demo> implements Protocol {
        setMessage(msg: string): IO {
            return this.hsm.unhandled();
        }
        tick(): IO { this.hsm.unhandled(); }
        async _entry() {}
        async _exit() {}
    }

    @ihsm.initialState
    export class State1 extends TopState {
        setMessage(msg: string): IO { this.ctx.message = "I was set by State1" }
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
        tick() {
            this.ctx.message = "State112 was here";
            ++this.ctx.counter;
            return State11;
        }
        async _entry() {}
        async _exit() {}
    }

    export class State2 extends TopState {
    }

}
