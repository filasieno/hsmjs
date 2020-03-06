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
    logging.info('initial state decorator called');
}

exports.initialState = initialState;

function exceptionState(State) {
    logging.info('exception state decorator called');
}
exports.exceptionState = exceptionState;
