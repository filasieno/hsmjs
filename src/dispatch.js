import {State} from './stateMachine';

function messageToString(messageType, messagePayload) {
    return `#${messageType}`;
}

async function dispatch(sm, signalName, payload) {
    sm.logTrace(`Begin dispatch: ${messageToString(signalName, payload)}`);
    ++sm.indent;
    try {
        // Execute the Method lookup
        let messageHandler = sm.currentState.prototype[signalName];
        if (!messageHandler) {
            throw {
                errorType: 'UnknownMessage',
                errorLevel: 'Application Error',
                errorMessage: `Cannot handle ${messageToString(signalName, payload)}`,
                actorType: `${sm.name}`,
                currentState: `${sm.currentState.name}`,
                toString: function() {
                    return this.errorType + ': ' + this.errorMessage;
                },
            };
        }

        let result = messageHandler.call(sm.bindObject, payload);
        // In case of a Promise wait for the actual result
        if (result instanceof Promise) {
            result = await result;
        }

        if (State.isPrototypeOf(result)) {
            console.log('Begin execute Transition');
            sm.currentState = result;
            console.log('End execute Transition');
        } else if (result === undefined) {
            return result;
        }

    } finally {
        --sm.indent;
        sm.logTrace('End Dispatch');
    }

}

function createSendTask(sm, signalName, payload, resolve, reject) {
    return function(doneCallback) {
        dispatch(sm, signalName, payload)
            .then(function() {resolve();})
            .catch(function(err) { reject(err); })
            .finally(function() {
                doneCallback();
            });
    };
}

function createSendTaskWithReply(sm, signalName, payload, resolve, reject) {
    return function(doneCallback) {
        dispatch(sm, signalName, payload)
            .then(function(result) {resolve(result);})
            .catch(function(err) {reject(err);})
            .finally(function() {
                doneCallback();
            });
    };
}

function createPostTask(sm, signalName, payload) {
    return function(doneCallback) {
        dispatch(sm, signalName, payload)
            .catch(function(err) {
                console.log(`${err}`);
                throw err;
                // createPostTask(sm, '_error', err);
            })
            .finally(function() {
                doneCallback();
            });
    };
}

//
// Public send API
//
function send(userActor, signal, ...payload) {
    userActor.__state__.queue.push(createPostTask(userActor.__state__, signal.name, payload));
}

exports.send = send;

function asyncSend(sm, signal, ...payload) {
    return new Promise(function(resolve, reject) {
        sm.queue.push(createSendTask(sm, signal.name, payload, resolve, reject));
    });
}

exports.asyncSend = asyncSend;


function asyncSendWithReply(sm, signal, ...payload) {
    return new Promise(function(resolve, reject) {
        sm.queue.push(createSendTaskWithReply(sm, signal.name, payload, resolve, reject));
    });
}

exports.asyncSendWithReply = asyncSendWithReply;
