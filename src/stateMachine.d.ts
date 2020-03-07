import { Queue } from "./ihsm.queue";
import { LogLevel as LogLevel } from "./logging"

export declare type Constructor<T = {}> = new (...args: any) => T;
export declare type StateClass<Data> = Constructor<State<Data>>;
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
    protected _init(): void;
    protected _exit(): Promise<void>;
    protected _entry(): Promise<void>;
}

export declare class Transition<Data> {
    exitList: any[];
    entryList: any[];
}

export declare class TransitionCache<Data> {
    [src: string]: {[dest: string]: Transition<Data>}
}

export declare class StateMachine<Data> {
    private readonly bindObject: StateBindObject<Data>;
    private readonly data: Data;
    private readonly queue: Queue;
    private currentState: State<Data>;
    private logLevel: LogLevel;
    private indent: number;
    public name: string;
    public nextState?: StateClass<Data>;
    private transitionCache: TransitionCache<Data>;
    constructor(topState: StateClass<Data>, protocol: StateClass<Data>, data: DataEx<Data>, logLevel?: LogLevel);
    send<Signal extends (...payload: any) => void | Promise<void>, Payload extends Parameters<(...payload: any) => any>>(signal: Signal, ...payload: Parameters<Signal>): void;
    // tran(nextState: StateClass<Data>): void;
    logTrace(msg: string): void;
    logDebug(msg: string): void;
    logWarn(msg: string): void;
    logInfo(msg: string): void;
    logError(msg: string): void;
    logFatal(msg: string): void;
    logMe(): void;
    unhandled(): void;
}
