import {logFatal} from './logging';


export function fail(msg: string) {
    logFatal(msg);
}
