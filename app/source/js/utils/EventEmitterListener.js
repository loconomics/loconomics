/**
    Listen to events emitted by node's EventEmitter objects
**/
'use strict';

var EventEmitterListener = function(target, event, handler) {
    this.target = target;
    this.event = event;
    this.handler = handler;

    target.on(event, handler);
};

EventEmitterListener.prototype.dispose = function() {
    this.target.removeListener(this.event, this.handler);
};

module.exports = EventEmitterListener;
