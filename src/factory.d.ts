
import type { DataObject, State, StateMachineDefinition } from "./stateMachine";

export declare function initStateMachine<Data, TopState extends State<Data>>(ctx: Data, def: StateMachineDefinition<Data, TopState>): DataObject<Data>;
export declare function createStateMachine<Data, TopState extends State<Data>>(def: StateMachineDefinition<Data, TopState>): DataObject<Data>;
export declare function validateStateMachine<Data, TopState extends State<Data>>(def: StateMachineDefinition<Data, TopState>): void;
