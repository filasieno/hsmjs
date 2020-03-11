import assert from "assert";
import * as ihsm from "../index";
import { IHsm, init, LogLevel } from "../index";

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




@init(TopState, LogLevel.TRACE)
class MyData {
    hsm!: IHsm<TopState, MyData>;
    name?: string;
    surname?: string;
    millis = 100;
}

async function main() {
    let myData = new MyData();
    let hsm = myData.hsm;
    assert(hsm.currentState === State1);
    hsm.post.switchAndLog("pre", "post");
    await hsm.send.switchAndLog("pre", "post");
    await hsm.send.setAndGet("name");
    let x = await hsm.send.setAndGet("name");
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


