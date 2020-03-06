import type { State } from './stateMachine';

export declare function initialState<StateClass extends State<Data>, Data>(State: new (...params: any) => StateClass): void;
export declare function exceptionState<StateClass extends State<Data>, Data>(State: new (...params: any) => StateClass): void;
