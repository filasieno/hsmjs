//
// Pick any class and transform it to a state machine.
//
//
//
import assert from "assert";
import { Parameters } from "impl";
//import { Parameters } from "impl";

import { UserClass } from "./userClass";

type Constructor<T = {}> = new (...args: any) => T;

enum LogLevel {
    TRACE, DEBUG, WARN, INFO, ERROR, FATAL
}

type StateMachineBindObject<Context> = { ctx: Context };

export class State<Context> {
    protected async _init(...args: ConstructorParameters<Constructor<Context>>) { console.log("on init") }
    protected async _exit() { console.log("Base Protocol On exit") }
    protected async _entry() { console.log("Base Protocol On Entry") };
    protected ctx!: Context;

    // selfSend<Data, Protocol extends State<Data>, BaseProtocol extends Protocol, EventHandlerFunction extends ((...args: any) => EventHandlerReturnType<Data, Protocol, BaseProtocol>)>(signal: EventHandlerFunction, ...payload: Parameters<EventHandlerFunction>): void {
    //     console.log(`send ${signal.name}${payload}`)
    // }
}

class Reply<Context> {

}

type RIO<Context> = Reply<Context>;
type IO<Context> = void | undefined | Constructor<State<Context>>;
type AIO<Context> = Promise<IO<Context>>;
type EventHandlerReturnType<Context> = IO<Context> | AIO<Context>
type StateClass<Context> = Constructor<State<Context>>;
class StateMachine<Context> {
    private currentState: StateClass<Context>;
    private protocol: any;
    private bindObject: StateMachineBindObject<Context>;
    private queue: object;
    private logLevel: LogLevel;
    constructor(initialState: StateClass<Context>, protocol: StateClass<Context>, userClassInstance: Context, logLevel: LogLevel = LogLevel.INFO) {
        this.currentState = initialState;
        this.bindObject = {ctx: userClassInstance};
        this.queue = {};
        this.logLevel = logLevel;
        this.protocol = protocol.prototype;
        // TODO: Execute init
    }
}


type Hsm<Context> = Context & { __state__: StateMachine<Context> };

function initial(stateConstructor: Function) {
    console.log(`initial state = ${stateConstructor.name}`)
}
type StateMachineDefinition<Context, P extends State<Context>, TS extends P> = {Protocol: Constructor<P>, TopState: Constructor<TS>}
declare function validateStateMachine<Context, P extends State<Context>, TS extends P>(def: StateMachineDefinition<Context, P, TS>) : void;
declare function initStateMachine<Context, P extends State<Context>, TS extends P>(ctx: Context, def: StateMachineDefinition<Context, P, TS>) : Hsm<Context>;

/// demo Begin
namespace SM {

    export class Protocol extends State<UserClass> {
        registerComponent(name: string, surname: string): IO<UserClass> { }
        nonMessage(msg1: string, msg2: string): string { return ""}
        async otherMessage(): AIO<UserClass> {
            return TopState;
        }
        async switchState(x: number, y: string, z: boolean): AIO<UserClass> {}
    }

    export class TopState extends Protocol {

    }

    @initial
    class WaitingEventsState extends TopState {
        async switchState(x: number, y: string, z: boolean): AIO<UserClass> {
            return ProcessingState;
        }
    }

    class ProcessingState extends TopState {
        async switchState(x: number, y: string, z: boolean): AIO<UserClass> {
            return WaitingEventsState;
        }
    }

}
let msg = SM.Protocol.prototype;
validateStateMachine(SM);
let myObj = new UserClass("name", "surname");
let myObjSM = initStateMachine(myObj, SM);

type Fn = (...payload:any) => any;

type EventHandlerType<Data> = (...payload:any) => EventHandlerReturnType<Data>;
export declare function send<Data, Signal extends EventHandlerType<Data>, Payload extends Parameters<Fn>>(hsm: Hsm<Data>, signal: Signal, ...payload: Parameters<Signal>): void;
export declare function asyncSend<Data, Signal extends EventHandlerType<Data>, Payload extends Parameters<Fn>>(hsm: Hsm<Data>, signal: Signal, ...payload: Parameters<Signal>): Promise<void>;

send(myObjSM, msg.switchState, 10, "x", true);

