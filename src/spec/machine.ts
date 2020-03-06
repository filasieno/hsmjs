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
        setMessage(msg: string): IO {
            return undefined;
        }
        async getMessage(): Promise<string | undefined> {
            return undefined;
        }
        tick(): IO {
            return undefined;
        }
    }

    @ihsm.initialState
    export class A extends TopState {
        protected async _entry() {
            this.hsm.logDebug("A entry");
        }

        protected async _exit() {
            this.hsm.logDebug("B exit");
        }

        tick() {
            this.ctx.message = "A was here";
            this.hsm.logDebug("Passed from A");
            ++this.ctx.counter;
        }
    }

    export class B extends TopState {
        protected async _entry() {
            this.hsm.logDebug("B entry");
        }

        protected async _exit() {
            this.hsm.logDebug("B exit");
        }
    }

}
