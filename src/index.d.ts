// Type definitions for ihsm 1.0.0
// Project: ihsm - Idiomatic Hierarchical State Machine - <https://github.com/filasieno/ihsm>
// Definitions by: Fabio N. Filasieno <https://github.com/filasieno/ihsm>
// TypeScript Version: 3.8

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Values
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export declare const enum LogLevel { ALL = 0, TRACE = 20, DEBUG = 30, INFO = 30, WARN = 40, ERROR = 50, FATAL = 60, OFF = 70 }

export declare class State<UserTopState extends State<UserTopState, UserData>, UserData = { [key: string]: any }> {
    protected constructor();
    protected readonly ctx: UserData;
    protected readonly hsm: IBoundHsm<UserTopState, UserData>;
    _init(...args: any[]): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
    onError(err: Error): Promise<void> | void;
}

export declare function initialState<UserTopState extends State<UserTopState, UserData>, UserData>(TargetState: StateConstructor<UserTopState, UserData>): void;
export declare function create<UserTopState extends State<UserTopState, UserData>, UserData>(userData: UserData, topState: StateConstructor<UserTopState, UserData>) : IHsm<UserTopState, UserData>;
export declare function init<UserTopState extends State<UserTopState, UserData>, UserData>(topState: TopStateConstructor<UserTopState, UserData>, logLevel: LogLevel.INFO, fieldName: string): (constructor: new (...args: any[]) => any) => (new (...args: any[]) => any);
export declare function init<UserTopState extends State<UserTopState, UserData>, UserData>(topState: TopStateConstructor<UserTopState, UserData>, logLevel: LogLevel): (constructor: new (...args: any[]) => any) => (new (...args: any[]) => any);
export declare function init<UserTopState extends State<UserTopState, UserData>, UserData>(topState: TopStateConstructor<UserTopState, UserData>): (constructor: new (...args: any[]) => any) => (new (...args: any[]) => any);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export declare type StateConstructor<UserTopState extends State<UserTopState, UserData>, UserData> = Function & {
    initialState?: StateConstructor<UserTopState, UserData>;
    exceptionState?: StateConstructor<UserTopState, UserData>;
    isInitialState?: boolean;
    prototype: State<UserTopState, UserData>;
};

export declare type TopStateConstructor<UserTopState extends State<UserTopState, UserData>, UserData> = Function & {
    initialState?: StateConstructor<UserTopState, UserData>;
    exceptionState?: StateConstructor<UserTopState, UserData>;
    isInitialState?: boolean;
    prototype: UserTopState;
};

export declare type PostProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = { [P in keyof UserTopState]: PostFunction<UserTopState[P]>; };
export declare type PostFunction<EventHandler> = EventHandler extends (...payload: any[]) => void | Promise<any> ? (...payload: any[]) => void : never;
export declare type SendProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = { [P in keyof UserTopState]: SendFunction<UserTopState[P]>; };
export declare type SendFunction<EventHandler> = EventHandler extends (...payload: any[]) => infer C ? C extends void ? (...payload: any[]) => Promise<void> : C extends Promise<infer RT> ? (...payload: any[]) => Promise<RT> : never : never;
export declare type UserDataType<UserTopState extends State<UserTopState, any>> = UserTopState extends State<UserTopState, infer UserData> ? UserData : never;

export declare interface IBaseHsm<UserTopState extends State<UserTopState, UserData>, UserData> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserTopState, UserData>;
    readonly topState: StateConstructor<UserTopState, UserData>;
    readonly post: PostProtocol<UserTopState, UserData>;
}

export declare interface IHsm<UserTopState extends State<UserTopState, UserData>, UserData = UserDataType<UserTopState>> extends IBaseHsm<UserTopState, UserData> {
    readonly ctx: UserDataType<UserTopState>;
    readonly send: SendProtocol<UserTopState, UserData>;
}

export declare interface IBoundHsm<UserTopState extends State<UserTopState, UserData>, UserData> extends IBaseHsm<UserTopState, UserData> {
    transition(nextState: StateConstructor<UserTopState, UserData>): void;
    unhandled(): never;
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}

export {};

