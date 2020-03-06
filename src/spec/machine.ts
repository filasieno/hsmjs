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
        getMessage(): Promise<string | undefined>;
    }

    export class TopState extends ihsm.State<Demo> implements Protocol {
        protected _init() {
            this.hsm.logDebug("TopState init");
        }

        setMessage(msg: string): IO { return this.hsm.unhandled(); }
        async getMessage(): Promise<string | undefined> {
            return undefined;
        }
        tick(): IO {
            return undefined;
        }
    }

    @ihsm.initialState
    export class State1 extends TopState {
        protected _init() {
            this.hsm.logDebug("State1 init");
        }
        protected async _entry() {
            this.hsm.logDebug("State1 entry");
        }

        protected async _exit() {
            this.hsm.logDebug("State1 exit");
        }
        setMessage(msg: string): IO { this.ctx.message = "I was set by State1" }
        tick() {
            this.ctx.message = "State1 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
    }

    export class State11 extends State1 {
        protected _init() {
            this.hsm.logDebug("State11 init");
        }
        protected async _entry() {
            this.hsm.logDebug("State11 entry");
        }

        protected async _exit() {
            this.hsm.logDebug("State11 exit");
        }

        tick() {
            this.ctx.message = "State11 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
    }

    @ihsm.initialState
    export class State12 extends State1 {
        protected _init() {
            this.hsm.logDebug("State12 init");
        }
        protected async _entry() {
            this.hsm.logDebug("State12 entry");
        }

        protected async _exit() {
            this.hsm.logDebug("State12 exit");
        }

        tick() {
            this.ctx.message = "State11 was here";
            this.hsm.logDebug("Passed from State1");
            ++this.ctx.counter;
        }
    }

    export class State2 extends TopState {
        protected _init() {
            this.hsm.logDebug("State2 init");
        }

        protected async _entry() {
            this.hsm.logDebug("State2 entry");
        }

        protected async _exit() {
            this.hsm.logDebug("State2 exit");
        }
    }

}
