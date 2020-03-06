
const INITIAL_ERR_CODE = 999;

const err = function() {
    let errorCode = INITIAL_ERR_CODE;
    return function defErr(msg: string) {
        return `IHSM-${++errorCode}: ${msg}`;
    };
}();

export namespace Err {
    export const MyErr1: string = err('MyErr1');
    export const MyErr2: string = err('MyErr2');
    export const MyErr3: string = err('MyErr3');
    export const MyErr4: string = err('MyErr4');
}
