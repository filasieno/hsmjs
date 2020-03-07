import { DataEx } from './stateMachine';

export declare function send<Data, Signal extends (...payload: any[]) => void | Promise<void>, Payload extends Parameters<(...payload: any[]) => any>>(hsm: DataEx<Data>, signal: Signal, ...payload: Parameters<Signal>): void;
export declare function asyncSend<Data, Signal extends (...payload: any[]) => void | Promise<void>, Payload extends Parameters<(...payload: any[]) => any>>(hsm: DataEx<Data>, signal: Signal, ...payload: Parameters<Signal>): Promise<void>;
