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
export declare type PostProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = {
    [P in keyof UserTopState]: PostFunction<UserTopState[P]>;
};
export declare type PostFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedValue ? ReturnedValue extends (void | undefined | null | Promise<any>) ? (...payload: Payload) => void : never : never;
export declare type SendProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = {
    [P in keyof UserTopState]: SendFunction<UserTopState[P]>;
};
export declare type SendFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedPromise ? ReturnedPromise extends Promise<infer Value> ? (...payload: Payload) => Promise<Value> : never : never;
export declare type UserDataType<UserTopState extends State<UserTopState, any>> = UserTopState extends State<UserTopState, infer UserData> ? UserData : never;
export interface IBaseHsm<UserTopState extends State<UserTopState, UserData>, UserData> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserTopState, UserData>;
    readonly topState: StateConstructor<UserTopState, UserData>;
    readonly post: PostProtocol<UserTopState, UserData>;
}
export interface IHsm<UserTopState extends State<UserTopState, UserData>, UserData = UserDataType<UserTopState>> extends IBaseHsm<UserTopState, UserData> {
    readonly ctx: UserData;
    readonly send: SendProtocol<UserTopState, UserData>;
}
export interface IBoundHsm<UserTopState extends State<UserTopState, UserData>, UserData> extends IBaseHsm<UserTopState, UserData> {
    transition(nextState: StateConstructor<UserTopState, UserData>): void;
    unhandled(): never;
    wait(millis: number): Promise<void>;
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
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
export interface State<UserTopState extends State<UserTopState, UserData>, UserData = {
    [key: string]: any;
}> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserTopState, UserData>;
    readonly post: PostProtocol<UserTopState, UserData>;
    _init(...args: any[]): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
}
export declare function create<UserTopState extends State<UserTopState, UserData>, UserData>(userData: UserData, topState: TopStateConstructor<UserTopState, UserData>, logLevel?: LogLevel): IHsm<UserTopState, UserData>;
export declare function init<UserTopState extends State<UserTopState, UserData>, UserData>(topState: TopStateConstructor<UserTopState, UserData>, logLevel?: LogLevel, fieldName?: string): (constructor: new (...args: any[]) => any) => (new (...args: any[]) => any);
export declare function initialState<UserTopState extends State<UserTopState, UserData>, UserData>(TargetState: StateConstructor<UserTopState, UserData>): void;
