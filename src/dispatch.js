const {Transition, getTransition} = require('./transition');
const {State} = require('./ihsm');

function messageToString(messageType, messagePayload) {
    return `#${messageType}`;
}
async function executeTransition(sm, tr, targetState) {
    const exitLen = tr.exitList.length;
    for (let i = 0; i < exitLen; ++i) {
        let stateProto = tr.exitList[i].prototype;
        if (Object.prototype.hasOwnProperty.call(stateProto,'_exit')){
            await stateProto._exit.call(sm.bindObject);
            console.log(`exit ${tr.exitList[i].name}`); //TODO:
        } else {
            console.log(`exit ${tr.exitList[i].name} [unimplemented]`); //TODO:
        }

    }
    const entryLen = tr.entryList.length;
    for (let i = 0; i < entryLen; ++i) {
        let stateProto = tr.entryList[i].prototype;
        if (Object.prototype.hasOwnProperty.call(stateProto,'_entry')){
            await stateProto._entry.call(sm.bindObject);
            console.log(`enter ${tr.entryList[i].name}`); //TODO:
        } else {
            console.log(`enter ${tr.entryList[i].name} [unimplemented]`); //TODO:
        }

    }
    sm.currentState = targetState;
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
            // Begin Transition
            sm.logTrace('Begin execute Transition');
            const srcName = sm.currentState.name;
            const destName = result.name;
            let cachedSrcDict = sm.transitionCache[srcName];
            if (cachedSrcDict === undefined) {
                // No src dict found
                const tr = getTransition(sm.currentState, result);
                sm.transitionCache[srcName] = {[destName]: tr};
                await executeTransition(sm, tr, result);
            } else {
                // A src dict has been found
                let cachedTransition = cachedSrcDict[destName];
                if (cachedTransition === undefined) {
                    const tr = getTransition(sm.currentState, result);
                    cachedSrcDict[destName] = tr;
                    await executeTransition(sm, tr, result);
                } else {
                    await executeTransition(sm, cachedTransition, result);
                }
            }
            sm.currentState = result;
            sm.logTrace('End execute Transition');
            // End Transition
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
function send(userDataEx, signal, ...payload) {
    userDataEx.__state__.queue.push(createPostTask(userDataEx.__state__, signal.name, payload));
}

exports.send = send;

function asyncSend(userDataEx, signal, ...payload) {
    return new Promise(function(resolve, reject) {
        userDataEx.__state__.queue.push(createSendTask(userDataEx.__state__, signal.name, payload, resolve, reject));
    });
}

exports.asyncSend = asyncSend;


function asyncSendWithReply(sm, signal, ...payload) {
    return new Promise(function(resolve, reject) {
        sm.queue.push(createSendTaskWithReply(sm, signal.name, payload, resolve, reject));
    });
}

exports.asyncSendWithReply = asyncSendWithReply;
