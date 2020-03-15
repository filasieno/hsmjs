import * as ihsm from "../index";
import { LogLevel } from "../index";

interface Protocol {
    switchAndLog(preMessage: string, postMessage: string): Promise<void>;
    setAndGet(msg: string): Promise<string>;
    hello(msg: string): Promise<void>;
    newHello(msg: string): string;
}

abstract class TopState extends ihsm.State<MyData, Protocol> implements Protocol{

    async hello(msg: string) {
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 1`);
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 2`);
        await this.hsm.wait(1000);
        this.hsm.logInfo(`${msg} 3`);
    }
    abstract setAndGet(msg: string): Promise<string>;

    async switchAndLog(preMessage: string, postMessage: string) {
        this.hsm.logInfo(`${preMessage} & ${postMessage}`);
        this.hsm.transition(State2);
    }

    newHello(msg: string): string {
        console.log(msg);
        return msg;
    }

}

@ihsm.initialState()
class State1 extends TopState {

    async setAndGet(name: string) {
        this.ctx.name = name;
        return name;
    }
}

class State2 extends TopState {

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
    let hsm = ihsm.create(TopState, myData, LogLevel.TRACE);
    hsm.post.switchAndLog('pre', 'post');
    await hsm.send.switchAndLog('pre', 'post');
    await hsm.send.setAndGet('x');
    let val: string = await hsm.send.newHello('x');
    let x = await hsm.send.setAndGet('name');
    hsm.post.hello('x');
}

(async () => {
    try {
        await Injected();
    } catch (e) {
    }
})();


