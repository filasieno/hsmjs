// export interface StateMachineDefinition<UserTopState extends TopState> {
//     State: UserTopState;
// }

export type StateMachineDefinition<UserTopState extends TopState> = { State: UserTopState }

export type Parameters<T> = T extends (...args: infer T) => any ? T : never;

export declare class TopState {
    protected logError(err: Error, message: string): void;
    protected logError(err: Error): void;
    protected logInfo(message: string): void;
    protected logWarn(message: string): void;
    protected logDebug(message: string): void;
    protected logTrace(message: string): void;
    protected logMe(): void;
}

export declare class StateMachineProtocol {
    post<TF extends Function>(signal: TF, ...payload: Parameters<TF>): void;
    send<TF extends Function>(signal: TF, ...payload: Parameters<TF>): Promise<void>;
}

export type StateMachine<UserTopState extends TopState> = UserTopState & StateMachineProtocol;

export declare function create<UserTopState extends TopState>(definition: object): StateMachine<UserTopState>;

export declare function validateStateMachine<UserTopState extends TopState>(definition: object): void;
