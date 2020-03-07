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
	exitPrototypeList = null;
	entryPrototypeList = null;

	* getTransitionActions() {
		for (const cls of this.exitList) {
			if (cls.prototype.hasOwnProperty('_exit')) {
				yield cls.prototype._exit;
			}
		}
		for (const cls of this.entryList) {
			if (cls.prototype.hasOwnProperty('_entry')) {
				yield cls.prototype._entry;
			}
		}
	}
}

function getTransition(src, dst) {
	const end = ihsm.State;
	let srcPath = [];
	let srcIndex = new Map();
	let dstPath = [];
	let cur = src;
	let i = 0;
	while (cur !== end) {
		srcPath.push(cur);
		srcIndex.set(cur, i);
		cur = cur.__proto__;
		++i;
	}
	cur = dst;
	while (cur !== end ) {
		let i = srcIndex.get(cur);
		if (i !== undefined) {
			srcPath = srcPath.slice(0, i);
			break;
		}
		dstPath.unshift(cur);
		cur = cur.__proto__;
	}
	while (dst.hasOwnProperty('_initialState')) {
		dst = dst._initialState;
		dstPath.push(dst);
	}

	let tran = new Transition();
	tran.exitList = srcPath;
	tran.entryList = dstPath;
	tran.exitPrototypeList = srcPath.map(x => x.prototype);
	tran.entryPrototypeList = dstPath.map(x => x.prototype);
	return tran;
}

exports.Transition = Transition;
exports.getTransition = getTransition;
