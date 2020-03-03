const assert = require('assert');

"use strict";

function validateStateMachine(stateMachine) {
    console.log("validateStateMachine called");
    return null;
}

class StateMachine {

    constructor(state) {
        this.__state__ = state;
    }

    async send(f) {
        console.log(`send of: ${f}`);
        return null;
    }

    post(f) {
        console.log(`post of: ${f}`);
        console.log(f);
    }

}

function create(stateMachine) {
    assert(stateMachine);
    return new StateMachine(stateMachine.Top);
}

class TopState {

    logError(err, message) {
        console.log(err);
        if (!message) return;
        console.log(message);
    }

    logInfo(message) {
        console.log(message);
    }

    logWarn(message) {
        console.log(message);
    }

    logDebug(message) {
        console.log(message);
    }

    logTrace(message) {
        console.log(message);
    }

    logMe() {
        console.log(this)
    }
}

exports.validateStateMachine = validateStateMachine;
exports.create = create;
exports.TopState = TopState;
