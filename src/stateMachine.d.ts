import { Level as LogLevel } from "./logging"

export declare type Constructor<T = {}> = new (...args: any) => T;
export declare type StateClass<Data> = Constructor<State<Data>>;
export declare type IO<Data> = void | Constructor<State<Data>> | undefined;
export declare type AIO<Data, ReturnValue = undefined> = Promise< IO<Data> | Reply<Data, ReturnValue> >;
export declare type AIOReply<Data, Value> = Promise<Reply<Data, Value>>;
export declare type DataEx<Data> = Data & { __state__: StateMachine<Data>; };
export declare type StateMachineDefinition<Data, TopState extends State<Data>> = { TopState: Constructor<TopState>; };

export declare class Reply<Data, Value> {
    value: Value;
    targetState?: StateClass<Data>;
    constructor(value: Value, targetState: StateClass<Data>);
}

export declare class StateBindObject<Data> {
    protected ctx: DataEx<Data>;
    protected hsm: StateMachine<Data>;
    constructor(ctx: DataEx<Data>, hsm: StateMachine<Data>);
}

export declare class State<Data> extends StateBindObject<Data> {
    protected _init(): Promise<void>;
    protected _exit(): Promise<void>;
    protected _entry(): Promise<void>;
}

export declare class StateMachine<Data> {
    private readonly protocol;
    private readonly bindObject;
    private readonly data;
    private readonly queue;
    private currentState;
    private logLevel;
    constructor(initialState: StateClass<Data>, protocol: StateClass<Data>, data: DataEx<Data>, logLevel?: LogLevel);
    send<Signal extends (...payload: any) => IO<Data> | AIO<Data>, Payload extends Parameters<(...payload: any) => any>>(signal: Signal, ...payload: Parameters<Signal>): void;
    valueWithTransition<ReturnValue>(returnValue: ReturnValue, targetState: StateClass<Data>): Promise<Reply<Data, ReturnValue>>;
    logTrace(msg: string): void;
    logDebug(msg: string): void;
    logWarn(msg: string): void;
    logInfo(msg: string): void;
    logError(msg: string): void;
    logFatal(msg: string): void;
    logMe(): void;
}
