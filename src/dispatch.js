const {Transition, getTransition} = require('./transition');
const {State} = require('./ihsm');

function messageToString(messageType, messagePayload) {
    return `#${messageType}`;
}

async function executeTransition(sm, tr) {
    const exitLen = tr.exitList.length;
    for (let i = 0; i < exitLen; ++i) {
        let stateProto = tr.exitList[i].prototype;
        if (Object.prototype.hasOwnProperty.call(stateProto, '_exit')) {
            await stateProto._exit.call(sm.bindObject);
            console.log(`exit ${tr.exitList[i].name}`); //TODO:
        } else {
            console.log(`exit ${tr.exitList[i].name} [unimplemented]`); //TODO:
        }

    }
    const entryLen = tr.entryList.length;
    let lastState = sm.currentState;
    for (let i = 0; i < entryLen; ++i) {
        lastState = tr.entryList[i];
        let stateProto = lastState.prototype;
        if (Object.prototype.hasOwnProperty.call(stateProto, '_entry')) {
            await stateProto._entry.call(sm.bindObject);
            console.log(`enter ${tr.entryList[i].name}`); //TODO:
        } else {
            console.log(`enter ${tr.entryList[i].name} [unimplemented]`); //TODO:
        }
    }
    sm.currentState = lastState;
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
        let output = undefined;
        if (result instanceof Promise) {
            output = await result;
        }

        if (sm.nextState != null) {
            const destState = sm.nextState;

            // Begin Transition
            sm.logTrace(`Begin Transition to: ${destState.name}`);
            const srcName = sm.currentState.name;
            const destName = destState.name;
            let cachedSrcDict = sm.transitionCache[srcName];
            if (cachedSrcDict === undefined) {
                // No src dict found
                const tr = getTransition(sm.currentState, destState);
                sm.transitionCache[srcName] = {[destName]: tr};
                await executeTransition(sm, tr);
            } else {
                // A src dict has been found
                let cachedTransition = cachedSrcDict[destName];
                if (cachedTransition === undefined) {
                    const tr = getTransition(sm.currentState, destState);
                    cachedSrcDict[destName] = tr;
                    await executeTransition(sm, tr);
                } else {
                    await executeTransition(sm, cachedTransition);
                }
            }
            sm.nextState = null;
            sm.logTrace('End execute Transition');
            // End Transition

        }

        if (output !== undefined) {
            return output[0];
        }

    } finally {
        --sm.indent;
        sm.logTrace('End Dispatch');
    }

}

function createSendTask(sm, signalName, payload, resolve, reject) {
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
