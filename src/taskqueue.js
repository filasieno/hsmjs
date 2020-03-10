(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        let v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "queue"], factory);
    }
})(function (require, exports) {

    const taskQueue = require("queue");

    exports.createTaskQueue = function createTaskQueue() {
        return taskQueue.queue({concurrency:1, timeout: 0, autostart: true});
    };

});
