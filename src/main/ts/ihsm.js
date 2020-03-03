"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var impl_1 = require("./impl");
exports.TopState = impl_1.TopState;
exports.create = impl_1.create;
exports.validateStateMachine = impl_1.validateStateMachine;
exports.StateMachineProtocol = impl_1.StateMachineProtocol;
function initial(classConstructor) {
    console.log("initial state declaration begin");
    console.log(classConstructor);
    console.log("initial state declaration end");
}
exports.initial = initial;
function protocol(classConstructor) {
    console.log("protocol declaration begin");
    console.log(classConstructor);
    console.log("protocol declaration end");
}
exports.protocol = protocol;
function unknownMessage(target, propertyKey, descriptor) {
    console.log("Definition of an abstractEvt method begin");
    console.log(propertyKey);
    console.log("Definition of an abstractEvt method end");
}
exports.unknownMessage = unknownMessage;
function message(target, propertyKey, descriptor) {
    console.log("Definition of a event");
    console.log(propertyKey);
    console.log("Definition of a event");
}
exports.message = message;
