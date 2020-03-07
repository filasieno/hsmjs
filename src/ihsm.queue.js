const queue = require('queue');

function create() {
    let value = queue({'concurrency': 1, 'autostart': true, 'timeout': 0});
    if (!value) throw new Error('Fatal logError creating a queue');
    return value;
}

exports.create = create;
