export { TopState, create, validateStateMachine, StateMachineProtocol } from "./impl";
export declare function initial<T>(classConstructor: new () => T): void;
export declare function protocol<T>(classConstructor: new () => T): void;
export declare function unknownMessage(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
export declare function message(target: any, propertyKey: string, descriptor: PropertyDescriptor): void;
