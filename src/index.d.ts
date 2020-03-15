export declare type StateConstructor<UserData, Protocol> = Function & {
    initialState?: StateConstructor<UserData, Protocol>;
    exceptionState?: StateConstructor<UserData, Protocol>;
    isInitialState?: boolean;
    prototype: IState<UserData, Protocol>;
};
export declare type PostProtocol<Protocol = undefined> = Protocol extends undefined ? {
    [key: string]: (...payload: any[]) => void;
} : Protocol extends {
    [key: string]: any;
} ? {
    [key in keyof Protocol]: PostFunction<Protocol[key]>;
} : never;
export declare type PostFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedValue ? ReturnedValue extends (void | undefined | null | Promise<void | undefined | null>) ? (...payload: Payload) => void : never : never;
export declare type SendProtocol<Protocol = undefined> = Protocol extends undefined ? {
    [key: string]: (...payload: any[]) => Promise<any>;
} : Protocol extends {
    [key: string]: any;
} ? {
    [key in keyof Protocol]: SendFunction<Protocol[key]>;
} : never;
export declare type SendFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedValue ? ReturnedValue extends Promise<infer Value> ? (...payload: Payload) => Promise<Value> : (...payload: Payload) => Promise<ReturnedValue> : never;
export interface IBaseHsm<UserData, Protocol> {
    logLevel: LogLevel;
    readonly name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserData, Protocol>;
    readonly topState: StateConstructor<UserData, Protocol>;
    readonly post: PostProtocol<Protocol>;
}
export interface IHsm<UserData = {
    [key: string]: any;
}, Protocol = undefined> extends IBaseHsm<UserData, Protocol> {
    readonly ctx: UserData;
    readonly send: SendProtocol<Protocol>;
}
export interface IHsmLogger {
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}
export interface IBoundHsm<UserData, Protocol> extends IBaseHsm<UserData, Protocol>, IHsmLogger {
    readonly post: PostProtocol<Protocol>;
    transition(nextState: StateConstructor<UserData, Protocol>): void;
    unhandled(): never;
    wait(millis: number): Promise<void>;
}
export interface IState<UserData = {
    [key: string]: any;
}, Protocol = undefined> {
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
}, Protocol = undefined> implements IState<UserData, Protocol> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserData, Protocol>;
    readonly post: PostProtocol<Protocol>;
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
export declare function initialState<UserData, Protocol>(): (TargetState: StateConstructor<UserData, Protocol>) => void;
