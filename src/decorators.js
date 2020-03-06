'use strict';
// Begin Utils
// eslint-disable-next-line no-invalid-this
const __importStar = (this && this.__importStar) || function(mod) {
    if (mod && mod.__esModule) return mod;
    const result = {};
    if (mod != null) for (const k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
};
Object.defineProperty(exports, '__esModule', {value: true});
// End Utils

const logging = __importStar(require('./logging'));

function initialState(State) {
    if (Object.prototype.hasOwnProperty.call(State.__proto__, 'initialState') && State.__proto__['initialState'] !== undefined) {
        throw new Error(`@ihsm.initialState has been set twice for parent class "${State.__proto__.name}"; check all classes that extend "${State.__proto__.name}"`); //TODO: move to errors
    }
    // if (Object.prototype.hasOwnProperty.call(State// , 'isInitial') && State['isInitial'] !== undefined) {
    //     throw new Error(`@ihsm.initialState has been set twice for target class: ${State.__proto__.name}`); //TODO: move to errors
    // }
    State.isInitial = true;
    State.__proto__.initialState = State;
}

exports.initialState = initialState;

function exceptionState(State) {
    throw new Error(`Unimplemented`);
}

exports.exceptionState = exceptionState;
