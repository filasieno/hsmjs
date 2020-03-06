const queue = require('queue');

function create() {
    return queue({'concurrency': 1, 'autostart': true, 'timeout': 0});
}

exports.create = create;
