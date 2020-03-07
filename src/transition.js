'use strict';

let __importStar = (this && this.__importStar) || function(mod) {
    if (mod && mod.__esModule) return mod;
    let result = {};
    if (mod != null) for (let k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
};

const ihsm = __importStar(require('./ihsm'));


class Transition {
    exitList = null;
    entryList = null;
}


function getTransition(src, dst) {
    const end = ihsm.State;
    let srcPath = [];
    const srcIndex = new Map();
	const dstPath = [];
    let cur = src;
    let i = 0;
    while (dst.hasOwnProperty('_initialState')) {
        dst = dst._initialState;
    }
    while (cur !== end) {
        srcPath.push(cur);
        srcIndex.set(cur, i);
        cur = cur.__proto__;
        ++i;
    }
    cur = dst;
    while (cur !== end) {
        let i = srcIndex.get(cur);
        if (i !== undefined) {
            srcPath = srcPath.slice(0, i);
            break;
        }
        dstPath.unshift(cur);
        cur = cur.__proto__;
    }
    let tran = new Transition();
    tran.exitList = srcPath;
    tran.entryList = dstPath;
    return tran;
}

exports.Transition = Transition;
exports.getTransition = getTransition;

