import { StateMachine } from "src/stateMachine";

export enum LogLevel {
    TRACE, DEBUG, WARN, INFO, ERROR, FATAL
}

export const logTrace = function<Data>(msg: string)  {
    console.log(msg);
};

export const logDebug = function<Data>(msg: string) {
    console.log(msg);
};

export const logInfo = function<Data>(msg: string) {
    console.log(msg);
};

export const logWarn = function<Data>(msg: string) {
    console.log(msg);
};

export const logError = function<Data>(msg: string) {
    console.log(msg);
};

export const logFatal = function<Data>(msg: string) {
    console.log(msg);
};
