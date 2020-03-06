import * as ihsm from "../ihsm"

class Pippo {
    name!: string;
}

namespace SM {
    type IO = ihsm.IO<Pippo>;
    type RIO<T> = ihsm.Reply<Pippo, T>;

    interface Protocol {
        eventA(name: string): Promise<IO>;
        eventB(): Promise<RIO<string>>;
        eventC(): IO
        eventD(): IO
        eventE(): IO
        eventI(): IO
    }

    export class TopState extends ihsm.State<Pippo> implements Protocol {
        async eventA(name: string) {}
        async eventB(): Promise<RIO<string>>{
            return this.hsm.reply("hello");
        }
        eventC() {}
        eventD() {}
        eventE() {}
        eventI() {}
    }

    @ihsm.initialState
    export class S1 extends TopState {
        eventI() {
            return S2;
        }
    }

    export class S11 extends S1 {
    }

    export class S2 extends TopState {
    }

    @ihsm.initialState
    export class S21 extends S2 {
    }

    @ihsm.initialState
    export class S211 extends S21 {
        eventD() {
            return S211;
        }
    }

}

let msg = SM.TopState.prototype;
let o1 = ihsm.initStateMachine(new Pippo(), SM);
let o2 = ihsm.createStateMachine(SM);
ihsm.send(o1, msg.eventA, "s");
async function myFun() {
    let result: string = await ihsm.asyncSendWithReply(o2, msg.eventB)
}

