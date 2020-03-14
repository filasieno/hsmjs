import { IBoundHsm, PostProtocol } from "../index";
import * as ihsm from "../index";

abstract class TopState implements ihsm.State<TopState, MyData> {
    readonly ctx!: MyData;
    readonly hsm!: IBoundHsm<TopState, MyData>;
    readonly post!: PostProtocol<TopState, MyData>;

    _init(...args: any[]): Promise<void> | void {}
    _entry(): Promise<void> | void {}
    _exit(): Promise<void> | void {}

    // Protocol
    abstract async switchAndLog(preMessage: string, postMessage: string): Promise<void>;
    abstract setAndGet(msg: string): Promise<string>;
    async hello(msg: string) {
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 1`);
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 2`);
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 3`);
    }

}

@ihsm.initialState
class State1 extends TopState {

    async switchAndLog(preMessage: string, postMessage: string) {
        console.log(preMessage);
        console.log(postMessage);
        this.hsm.transition(State2);
    }

    async setAndGet(name: string) {
        this.ctx.name = name;
        return name;
    }
}

class State2 extends TopState {

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

class MyData {
    name?: string;
}

async function Injected() {
    let myData = new MyData();
    let hsm = ihsm.create(myData, TopState);
    hsm.post.switchAndLog("pre", "post");
    await hsm.send.switchAndLog("pre", "post");
    await hsm.send.setAndGet("x");
    let x = await hsm.send.setAndGet("name");

    console.log(x);
    hsm.post.hello("x");
    console.log("done");
}

(async () => {
    try {
        await Injected();
        console.log();
    } catch (e) {
        console.log(e);
    }
})();


