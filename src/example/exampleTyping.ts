import * as ihsm from '../ihsm';

class Pippo {
    name!: string;
}

namespace SM {
    type IO = ihsm.IO<Pippo>;
    type RIO<T> = ihsm.Reply<Pippo, T>;

    interface Protocol {
        eventA(name: string): Promise<IO>;
        eventC(): IO
        eventD(): IO
        eventE(): IO
        eventI(): IO
    }

    export class TopState extends ihsm.State<Pippo> implements Protocol {
        async eventA(name: string) {}
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

const msg = SM.TopState.prototype;
const o1 = ihsm.init(new Pippo(), SM);
const o2 = ihsm.create(SM);
ihsm.send(o1, msg.eventA, 's');
async function myFun() {
    //const result: string = await ihsm.asyncSendWithReply(o2, msg.eventB);
}

