
import type {DataEx, State, StateMachineDefinition} from './stateMachine';

export declare function init<Data, TopState extends State<Data>>(ctx: Data, def: StateMachineDefinition<Data, TopState>): DataEx<Data>;
export declare function create<Data, TopState extends State<Data>>(def: StateMachineDefinition<Data, TopState>): DataEx<Data>;
export declare function validate<Data, TopState extends State<Data>>(def: StateMachineDefinition<Data, TopState>): void;
