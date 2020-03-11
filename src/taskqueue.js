(function(factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        const v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (define && typeof define === 'function' && define.amd) {
        define(['require', 'exports', 'queue'], factory);
    }
})(function(require, exports) {
    const queue = require('queue');
    exports.createTaskQueue = function createTaskQueue() {
        return queue({concurrency: 1, timeout: 0, autostart: true});
    };
});
