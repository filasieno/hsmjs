function validate(exports, verbose = false) {
    for (let exportedKey in exports) {
        if (!exports.hasOwnProperty(exportedKey)) continue;
        let value = exports[exportedKey];
        if (!State.isPrototypeOf(value)) continue;
        console.log(`state: ${exportedKey}`);
    }
}

/**
 * The top state
 */
class State {

}

/**
 *
 * @param {Actor} actor
 * @param {State} state
 */
function transition(actor, state) {

}

/**
 *
 * @param {Actor} actor
 * @param {State} state
 */
async function asyncTransition(actor, state) {

}

exports.State = State;
exports.validate = validate;
exports.transition = transition;
exports.asyncTransition = asyncTransition;
