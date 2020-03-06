import type {AIO, AIOReply, DataEx, IO} from './stateMachine';

export declare function send<Data, Signal extends (...payload: any[]) => IO<Data> | AIO<Data>, Payload extends Parameters<(...payload: any[]) => any>>(hsm: DataEx<Data>, signal: Signal, ...payload: Parameters<Signal>): void;
export declare function asyncSend<Data, Signal extends (...payload: any[]) => IO<Data> | AIO<Data>, Payload extends Parameters<(...payload: any[]) => any>>(hsm: DataEx<Data>, signal: Signal, ...payload: Parameters<Signal>): Promise<void>;
export declare function asyncSendWithReply<ReturnValue, Data, Signal extends (...payload: any) => AIOReply<Data, ReturnValue>, Payload extends Parameters<(...payload: any) => any>>(hsm: DataEx<Data>, signal: Signal, ...payload: Parameters<Signal>): Promise<ReturnValue>;
