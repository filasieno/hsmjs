declare type SignalOf<Protocol extends {
    [key: string]: any;
} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? string : Signal;
declare type PayloadOf<Protocol extends {
    [key: string]: any;
} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? any[] : Protocol[Signal] extends (...payload: infer Payload) => any ? Payload : never;
declare type ReturnValueOf<Protocol extends {
    [key: string]: any;
} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? any : Protocol[Signal] extends (...payload: any[]) => infer ReturnType ? ReturnType extends Promise<infer Value> ? Value : ReturnType : never;
export declare type StateConstructor<UserData, Protocol extends {
    [key: string]: any;
} | undefined> = Function & {
    initialState?: StateConstructor<UserData, Protocol>;
    exceptionState?: StateConstructor<UserData, Protocol>;
    isInitialState?: boolean;
    prototype: IState<UserData, Protocol>;
};
export interface IBaseHsm<UserData, Protocol extends {
    [key: string]: any;
} | undefined> {
    logLevel: LogLevel;
    readonly name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserData, Protocol>;
    readonly topState: StateConstructor<UserData, Protocol>;
    post<Signal extends keyof Protocol>(signal: SignalOf<Protocol, Signal>, ...payload: PayloadOf<Protocol, Signal>): void;
}
export interface IHsm<UserData = {
    [key: string]: any;
}, Protocol extends {
    [key: string]: any;
} | undefined = undefined> extends IBaseHsm<UserData, Protocol> {
    readonly ctx: UserData;
    send<Signal extends keyof Protocol>(signal: SignalOf<Protocol, Signal>, ...payload: PayloadOf<Protocol, Signal>): Promise<ReturnValueOf<Protocol, Signal>>;
}
export interface IHsmDebug {
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}
export interface IHsmHooks<UserData, Protocol extends {
    [key: string]: any;
} | undefined> {
    preTransition(ctx: UserData, from: StateConstructor<UserData, Protocol>, to: StateConstructor<UserData, Protocol>): void;
    postTransition(ctx: UserData, from: StateConstructor<UserData, Protocol>, to: StateConstructor<UserData, Protocol>): void;
    preInit(ctx: UserData, args: any[], state: StateConstructor<UserData, Protocol>): void;
    postInit(ctx: UserData, args: any[], state: StateConstructor<UserData, Protocol>): void;
    preStateEntry(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    postStateEntry(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    preStateExit(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    postStateExit(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    preDispatch(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    postDispatch(ctx: UserData, state: StateConstructor<UserData, Protocol>, result?: any, error?: Error): void;
}
export interface IBoundHsm<UserData, Protocol extends {
    [key: string]: any;
} | undefined> extends IBaseHsm<UserData, Protocol>, IHsmDebug {
    transition(nextState: StateConstructor<UserData, Protocol>): void;
    unhandled(): never;
    wait(millis: number): Promise<void>;
}
export interface IState<UserData = {
    [key: string]: any;
}, Protocol extends {
    [key: string]: any;
} | undefined = undefined> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserData, Protocol>;
    _init(...args: any[]): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
}
export declare enum LogLevel {
    ALL = 0,
    TRACE = 20,
    DEBUG = 30,
    INFO = 30,
    WARN = 40,
    ERROR = 50,
    FATAL = 60,
    OFF = 70
}
export declare class State<UserData = {
    [key: string]: any;
}, Protocol extends {
    [key: string]: any;
} | undefined = undefined> implements IState<UserData, Protocol> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserData, Protocol>;
    _init(..._: any[]): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
}
export declare function createObject(topState: StateConstructor<{
    [key: string]: any;
}, undefined>, logLevel?: LogLevel): IHsm<{
    [key: string]: any;
}, undefined>;
export declare function create<UserData, Protocol>(topState: StateConstructor<UserData, Protocol>, userData: UserData, logLevel?: LogLevel): IHsm<UserData, Protocol>;
export declare function init<UserData, Protocol>(topState: StateConstructor<UserData, Protocol>, logLevel?: LogLevel, fieldName?: string): (constructor: new (...args: any[]) => any) => (new (...args: any[]) => any);
export declare function initialState<UserData, Protocol>(): (state: StateConstructor<UserData, Protocol>) => void;
export {};
