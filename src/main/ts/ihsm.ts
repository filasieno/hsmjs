export { TopState, create, validateStateMachine, StateMachineProtocol } from "./impl"


export function initial<T>(classConstructor: new () => T) {
    console.log("initial state declaration begin");
    console.log(classConstructor);
    console.log("initial state declaration end");
}

export function protocol<T>(classConstructor: new () => T) {
    console.log("protocol declaration begin");
    console.log(classConstructor);
    console.log("protocol declaration end");
}

export function unknownMessage(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("Definition of an abstractEvt method begin");
    console.log(propertyKey);
    console.log("Definition of an abstractEvt method end");
}

export function message(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("Definition of a event");
    console.log(propertyKey);
    console.log("Definition of a event");
}

