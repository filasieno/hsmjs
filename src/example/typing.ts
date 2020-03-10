import assert from "assert";
import * as ihsm from "../index";

class MyData {
    public name?: string;
    public surname?: string;
    public millis = 100;
}

namespace StateMachine {

    function sleep(millis: number) {
        return new Promise((resolve) => {
            setInterval(() => {resolve()}, millis);
        })
    }

    export abstract class TopState extends ihsm.State<TopState, MyData> {
        abstract async switchAndLog(preMessage: string, postMessage: string) : Promise<void>;
        abstract setAndGet(msg: string): Promise<string>;
    }

    @ihsm.initialState
    export class State1 extends TopState {

        async switchAndLog(preMessage: string, postMessage: string) {
            console.log(preMessage);
            this.hsm.transition(State2);
            console.log(postMessage);
        }

        async setAndGet(name: string) {
            this.ctx.name = name;
            return name;
        }
    }

    export class State2 extends TopState {

        async switchAndLog(preMessage: string, postMessage: string) {
            console.log(preMessage);
            this.hsm.transition(State1);
            console.log(postMessage);
        }

        async setAndGet(name: string) {
            this.ctx.name = name;
            return name;
        }
    }

    console.log("Initialized")
}


async function main() {
    let myData = new MyData();
    let hsm = ihsm.initHsm(StateMachine, myData, ihsm.LogLevel.TRACE);
    assert(hsm.currentState === StateMachine.State1);
    hsm.send.switchAndLog("pre", "post");
    await hsm.asyncSend.switchAndLog("pre", "post");
    await hsm.send.setAndGet("name");
    let x = await hsm.asyncSend.setAndGet("name");
    console.log(x);
    console.log("done");
}

(async () => {
    try {
        await main();
        console.log();
    } catch (e) {
        console.log(e);
    }
})();


