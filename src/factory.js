import {StateMachine} from './stateMachine';
import {LogLevel} from './logging';

/**
 *
 * @param ctx
 * @param def
 * @param logLevel
 * @returns {*}
 */
function init(ctx, def, logLevel) {
    if (def === undefined) { throw new Error('def must not be null'); }
    if (!Object.hasOwnProperty.call(def, 'TopState')) { throw new Error('def must have a TopState'); }
    if (logLevel === undefined) { logLevel = LogLevel.INFO; }
    let TopState = def.TopState;
    let sm = new StateMachine(TopState, ctx, logLevel);
    try {
        ctx.__state__ = sm;
    } catch (ex) {
        throw new Error(`failed to set property __state__ on ${ctx.__proto__.constructor.name}`);
    }
    let currState = TopState;
    while(true) {
        if (Object.prototype.hasOwnProperty.call(currState.prototype, "_init")) {
            currState.prototype['_init'].call(sm.bindObject);
            console.log(`${currState.name} init done`); //TODO:
        } else {
            console.log(`${currState.name} init [unimplemented]`); //TODO:
        }
        if (Object.prototype.hasOwnProperty.call(currState, 'initialState')) {
            currState = sm['currentState'] = currState['initialState'];
        } else {
            break
        }
    }
    return ctx;
}

exports.init = init;

function create(def) {
    throw new Error('Unimplemented');
}

exports.create = create;

function validate(def) {
    throw new Error('Unimplemented');
}

exports.validate = validate;
