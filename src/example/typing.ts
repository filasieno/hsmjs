import * as ihsm from "../index";

class MyData {
    public name?: string;
    public surname?: string;
    public millis = 1000;
}

namespace StateMachine {

    function sleep(millis: number) {
        return new Promise((resolve) => {
            setInterval(() => {resolve()}, millis);
        })
    }

    export class State extends ihsm.State<State, MyData> {
        async waitAndLog(preMessage: string, postMessage: string) { this.hsm.unhandled() }
        justLog(msg: string): void { this.hsm.unhandled() }
        eventHandler(): void { this.hsm.unhandled() }
        getMessage(): Promise<string> { this.hsm.unhandled(); }
        setAndGet(msg: string): Promise<string> { this.hsm.unhandled(); }
    }

    @ihsm.initialState
    export class State1 extends ihsm.State<State, MyData> {

        async waitAndLog(preMessage: string, postMessage: string) {
            this.hsm.logInfo(preMessage);
            await sleep(this.ctx.millis);
            console.log(postMessage);
            this.hsm.logInfo(preMessage);
        }
    }



}
// ihsm.validate(StateMachine);


let myData = new MyData();
let hsm = ihsm.initHsm(StateMachine, myData, ihsm.LogLevel.TRACE);
hsm.logLevel = ihsm.LogLevel.TRACE;
hsm.name = "MyActor";
hsm.send.waitAndLog("pre message", "postMessage");



