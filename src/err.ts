
const INITIAL_ERR_CODE = 999;

let err = function () {
    let errorCode = INITIAL_ERR_CODE;
    return function defErr(msg: string) { return `IHSM-${++errorCode}: ${msg}`; }
}();

export namespace Err {
    export let MyErr1: string =  err("MyErr1");
    export let MyErr2: string =  err("MyErr2");
    export let MyErr3: string =  err("MyErr3");
    export let MyErr4: string =  err("MyErr4");
}