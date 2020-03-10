import { TaskQueue } from "./taskqueue";
export declare const enum LogLevel {
    ALL = 0,
    TRACE = 20,
    DEBUG = 30,
    INFO = 30,
    WARN = 40,
    ERROR = 50,
    FATAL = 60,
    OFF = 70
}
export declare let defaultLogLevel: LogLevel;
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
export declare type UserDataEx<UserTopState extends State<UserTopState, UserData>, UserData> = UserData & {
    __hsm__: IHsm<UserTopState, UserData>;
};
export declare type StateMachineDefinition<UserTopState extends State<UserTopState, UserData>, UserData> = {
    TopState: TopStateConstructor<UserTopState, UserData>;
};
export declare type MessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => void | Promise<any> ? (...payload: any[]) => void : never;
export declare type AsyncMessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => infer C ? C extends void ? (...payload: any[]) => Promise<void> : C extends Promise<infer RT> ? (...payload: any[]) => Promise<RT> : never : never;
export declare type SendProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = {
    [P in keyof UserTopState]: MessageSender<UserTopState[P]>;
};
export declare type AsyncSendProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = {
    [P in keyof UserTopState]: AsyncMessageSender<UserTopState[P]>;
};
export interface IBaseHsm<UserTopState extends State<UserTopState, UserData>, UserData> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserTopState, UserData>;
    readonly topState: StateConstructor<UserTopState, UserData>;
}
export interface IHsm<UserTopState extends State<UserTopState, UserData>, UserData> extends IBaseHsm<UserTopState, UserData> {
    readonly ctx: UserDataEx<UserTopState, UserData>;
    readonly send: SendProtocol<UserTopState, UserData>;
    readonly asyncSend: AsyncSendProtocol<UserTopState, UserData>;
    readonly queue: TaskQueue;
}
export interface IHsmObject<UserTopState extends State<UserTopState, UserData>, UserData> extends IBaseHsm<UserTopState, UserData> {
    transition(nextState: StateConstructor<UserTopState, UserData>): void;
    unhandled(): never;
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}
export declare abstract class BindTarget<UserTopState extends State<UserTopState, UserData>, UserData> {
    protected readonly ctx: UserDataEx<UserTopState, UserData>;
    protected readonly hsm: IHsmObject<UserTopState, UserData>;
    protected readonly send: SendProtocol<UserTopState, UserData>;
}
export declare class State<UserTopState extends State<UserTopState, UserData>, UserData = {
    [k: string]: any;
}> extends BindTarget<UserTopState, UserData> {
    constructor();
    _init(): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
    onError(err: Error): Promise<void> | void;
}
export declare function validate<UserTopState extends State<UserTopState, UserData>, UserData>(def: StateMachineDefinition<UserTopState, UserData>): void;
export declare function init<UserTopState extends State<UserTopState, UserData>, UserData>(def: StateMachineDefinition<UserTopState, UserData>, data: UserData, logLevel?: LogLevel): UserDataEx<UserTopState, UserData>;
export declare function get<UserTopState extends State<UserTopState, UserData>, UserData>(data: UserDataEx<UserTopState, UserData>): IHsm<UserTopState, UserData>;
export declare function initHsm<UserTopState extends State<UserTopState, UserData>, UserData>(def: StateMachineDefinition<UserTopState, UserData>, data: UserData, logLevel?: LogLevel): IHsm<UserTopState, UserData>;
export declare function initialState<UserTopState extends State<UserTopState, UserData>, UserData>(TargetState: StateConstructor<UserTopState, UserData>): void;
export declare function errorState<UserState extends UserTopState, UserTopState extends State<UserTopState, UserData>, UserData>(state: new () => UserState): void;
declare class Transition<UserTopState extends State<UserTopState, UserData>, UserData> {
    readonly exitList: Array<StateConstructor<UserTopState, UserData>>;
    readonly entryList: Array<StateConstructor<UserTopState, UserData>>;
    readonly exitPrototypeList: Array<any>;
    readonly entryPrototypeList: Array<any>;
    constructor(exitList: Array<StateConstructor<UserTopState, UserData>>, entryList: Array<StateConstructor<UserTopState, UserData>>, exitPrototypeList: Array<any>, entryPrototypeList: Array<any>);
    getTransitionActions(): Generator<any, void, unknown>;
}
export declare function getTransition<UserTopState extends State<UserTopState, UserData>, UserData>(srcState: StateConstructor<UserTopState, UserData>, destState: StateConstructor<UserTopState, UserData>, topState: StateConstructor<UserTopState, UserData>): Transition<UserTopState, UserData>;
export {};
//# sourceMappingURL=index.d.ts.map