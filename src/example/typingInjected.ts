import * as ihsm from "../index";


interface Protocol {
    switchAndLog(preMessage: string, postMessage: string): Promise<void>;
    setAndGet(msg: string): Promise<string>;
    hello(msg: string): Promise<void>;
}

abstract class TopState extends ihsm.State<MyData, Protocol> implements Protocol {
    abstract async switchAndLog(preMessage: string, postMessage: string): Promise<void>;
    async setAndGet(name: string) {
        this.ctx.name = name;
        return name;
    }
    async hello(msg: string): Promise<void> {
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 1`);
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 2`);
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 3`);
    }
}

@ihsm.initialState()
class State1 extends TopState {

    async switchAndLog(preMessage: string, postMessage: string) {
        this.hsm.logInfo( `${preMessage} invoked switchAndLog ${postMessage}`);
        this.hsm.transition(State2);
    }

}

@ihsm.init(TopState, ihsm.LogLevel.TRACE)
class MyData {
    hsm!: ihsm.IHsm<MyData, Protocol>;
    name?: string;
}

export class State2 extends TopState {

    async switchAndLog(preMessage: string, postMessage: string) {
        this.hsm.logInfo( `this is a user message: ${preMessage} - ${postMessage}`);
        this.hsm.transition(State2);
    }

}

async function Injected() {
    let myData = new MyData();
    let hsm = myData.hsm;
    hsm.post.switchAndLog("pre", "post");
    await hsm.send.switchAndLog("pre", "post");
    await hsm.send.setAndGet("x");
    let x = await hsm.send.setAndGet("name");
    // console.log(`value = "${x}"`);
    await hsm.send.hello("x");
}

(async () => {
    try {
        await Injected();
    } catch (e) {
        console.log(e);
    }
})();


