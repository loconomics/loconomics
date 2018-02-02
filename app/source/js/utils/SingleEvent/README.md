# SingleEvent utility package
It provides a default class named SingleEvent that enforces the pattern of declare
the events of your object as properties, one for each supported event type/name;
in opposite to the EventEmitter pattern that lets an object to emit multiple
events from the same source just providing a string with the type/name.

## SingleEvent class
The default class lives on *index.js* so the folder name can be imported without
specifing the name again.
Check its inline documentation for more.

## Extras
It includes too other classes and utilities built around SingleEvent. All are
documented inline using *jsdocs* comments.
