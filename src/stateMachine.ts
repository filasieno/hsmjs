import * as logging from "./logging";

export type Constructor<T = {}> = new (...args: any) => T;
export type StateClass<Data> = Constructor<State<Data>>;
export type IO<Data> = void | undefined | Constructor<State<Data>>;
export type AIO<Data> = Promise<IO<Data>>;
export type AIOReply<Data, Value> = Promise<Reply<Data, Value>>;
export type DataObject<Data> = Data & { __state__: StateMachine<Data> };
export type StateMachineDefinition<Data, TopState extends State<Data>> = { TopState: Constructor<TopState> }

export class Reply<Data, Value> {
    value: Value;
    targetState?: StateClass<Data>;
    constructor(value: Value, targetState?: StateClass<Data>) {
        this.value = value;
        this.targetState = targetState;
    }
}

export class StateBindObject<Data> {
    public ctx: DataObject<Data>;
    public hsm: StateMachine<Data>;
    constructor(ctx: DataObject<Data>, hsm: StateMachine<Data>) {
        this.ctx = ctx;
        this.hsm = hsm;
    }
}

export class State<Data> extends StateBindObject<Data> {
    protected async _init(...args: ConstructorParameters<Constructor<Data>>) { }
    protected async _exit() { }
    protected async _entry() { };
}

export class StateMachine<Data> {
    private readonly protocol: any;
    private readonly bindObject: StateBindObject<Data>;
    private readonly data: DataObject<Data>;
    private readonly queue: object;

    private currentState: StateClass<Data>;
    private logLevel: logging.Level;

    constructor(initialState: StateClass<Data>, protocol: StateClass<Data>, data: DataObject<Data>, logLevel: logging.Level = logging.Level.INFO) {
        this.currentState = initialState;
        this.bindObject = new StateBindObject<Data>(data, this);
        this.data = data;
        this.queue = {};
        this.logLevel = logLevel;
        this.protocol = protocol.prototype;
        // TODO: Execute init
    }

    send<Signal extends (...payload: any) => IO<Data> | AIO<Data>, Payload extends Parameters<(...payload: any) => any>>(signal: Signal, ...payload: Parameters<Signal>): void {
        send(this.data, signal, ...payload);
    }

    async reply<ReturnValue>(returnValue: ReturnValue, transition?: StateClass<Data>): Promise<Reply<Data, ReturnValue>> {
        return new Reply(returnValue, transition);
    }

    logTrace(msg: string) {
        logging.trace(msg);
    }
    logDebug(msg: string) {
        logging.debug(msg);
    }
    logWarn(msg: string) {
        logging.warn(msg);
    }
    logInfo(msg: string) {
        logging.info(msg);
    }
    logError(msg: string) {
        logging.error(msg);
    }
    logFatal(msg: string) {
        logging.fatal(msg);
    }

    logMe(msg: string) {
        //TODO: ...
    }
}

declare function send<Data, Signal extends (...payload: any) => IO<Data> | AIO<Data>, Payload extends Parameters<(...payload: any) => any>>(hsm: DataObject<Data>, signal: Signal, ...payload: Parameters<Signal>): void;
declare function asyncSend<Data, Signal extends (...payload: any) => IO<Data> | AIO<Data>, Payload extends Parameters<(...payload: any) => any>>(hsm: DataObject<Data>, signal: Signal, ...payload: Parameters<Signal>): Promise<void>;
declare function asyncSendWithReply<ReturnValue, Data, Signal extends (...payload: any) => AIOReply<Data, ReturnValue>, Payload extends Parameters<(...payload: any) => any>>(hsm: DataObject<Data>, signal: Signal, ...payload: Parameters<Signal>): Promise<ReturnValue>;

