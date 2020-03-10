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
export interface StateConstructor<TopState extends State<TopState, UserData>, UserData> {
    new (): State<TopState, UserData>;
    prototype: any;
    initialState?: StateConstructor<TopState, UserData>;
    exceptionState?: StateConstructor<TopState, UserData>;
    isInitialState?: boolean;
}
export interface TopStateConstructor<TopState extends State<TopState, UserData>, UserData> extends StateConstructor<TopState, UserData> {
    new (): TopState;
}
export declare type UserDataEx<TopState extends State<TopState, UserData>, UserData> = UserData & {
    __hsm__: IHsm<TopState, UserData>;
};
export declare type StateMachineDefinition<TopState extends State<TopState, UserData>, UserData> = {
    State: TopStateConstructor<TopState, UserData>;
};
export declare type MessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => void | Promise<any> ? (...payload: any[]) => void : never;
export declare type AsyncMessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => infer C ? C extends void ? (...payload: any[]) => Promise<void> : C extends Promise<infer RT> ? (...payload: any[]) => Promise<RT> : never : never;
export declare type SendProtocol<TopState extends State<TopState, UserData>, UserData> = {
    [P in keyof TopState]: MessageSender<TopState[P]>;
};
export declare type AsyncSendProtocol<TopState extends State<TopState, UserData>, UserData> = {
    [P in keyof TopState]: AsyncMessageSender<TopState[P]>;
};
export interface IBaseHsm<TopState extends State<TopState, UserData>, UserData> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<TopState, UserData>;
    readonly topState: StateConstructor<TopState, UserData>;
}
export interface IHsm<TopState extends State<TopState, UserData>, UserData> extends IBaseHsm<TopState, UserData> {
    readonly ctx: UserDataEx<TopState, UserData>;
    readonly send: SendProtocol<TopState, UserData>;
    readonly asyncSend: AsyncSendProtocol<TopState, UserData>;
}
export interface IHsmObject<TopState extends State<TopState, UserData>, UserData> extends IBaseHsm<TopState, UserData> {
    transition(nextState: StateConstructor<TopState, UserData>): void;
    unhandled(): never;
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}
export declare abstract class BindTarget<TopState extends State<TopState, UserData>, UserData> {
    protected readonly ctx: UserDataEx<TopState, UserData>;
    protected readonly hsm: IHsmObject<TopState, UserData>;
    protected readonly send: SendProtocol<TopState, UserData>;
}
export declare class State<TopState extends State<TopState, UserData>, UserData = {
    [k: string]: any;
}> extends BindTarget<TopState, UserData> {
    constructor();
    _init(): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
    onError(err: Error): Promise<void>;
}
export declare function validate<TopState extends State<TopState, UserData>, UserData>(def: StateMachineDefinition<TopState, UserData>): void;
export declare function init<TopState extends State<TopState, UserData>, UserData>(def: StateMachineDefinition<TopState, UserData>, data: UserData, logLevel?: LogLevel): UserDataEx<TopState, UserData>;
export declare function get<TopState extends State<TopState, UserData>, UserData>(data: UserDataEx<TopState, UserData>): IHsm<TopState, UserData>;
export declare function initHsm<TopState extends State<TopState, UserData>, UserData>(def: StateMachineDefinition<TopState, UserData>, data: UserData, logLevel?: LogLevel): IHsm<TopState, UserData>;
export declare function initialState<TopState extends State<TopState, UserData>, UserData>(state: LooseObject): void;
export declare function errorState<UserState extends TopState, TopState extends State<TopState, UserData>, UserData>(state: new () => UserState): void;
declare class Transition<TopState extends State<TopState, UserData>, UserData> {
    readonly exitList: Array<StateConstructor<TopState, UserData>>;
    readonly entryList: Array<StateConstructor<TopState, UserData>>;
    readonly exitPrototypeList: Array<any>;
    readonly entryPrototypeList: Array<any>;
    constructor(exitList: Array<StateConstructor<TopState, UserData>>, entryList: Array<StateConstructor<TopState, UserData>>, exitPrototypeList: Array<any>, entryPrototypeList: Array<any>);
    getTransitionActions(): Generator<any, void, unknown>;
}
export declare function getTransition<TopState extends State<TopState, UserData>, UserData>(srcState: StateConstructor<TopState, UserData>, destState: StateConstructor<TopState, UserData>): Transition<TopState, UserData>;
interface LooseObject {
    [key: string]: any;
}
export {};
//# sourceMappingURL=index.d.ts.map