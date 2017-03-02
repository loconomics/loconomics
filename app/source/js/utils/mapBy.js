/*
    Creates a mapping object from a collection based on the results of an applied function.
*/
'use strict';

/*
    mapBy

    Arguments:
        collection: the collection to be mapped
        mapping: the mapping function applied to each item in the collection. It should yield a key
          with which to map the object.

    It is assumed that within a collection, the mapping function will return unique values. If this
    is not the case, use groupBy.

    Examples:
        mapBy([{id: 1}, {id: 2}, {id: 3}], function(o) { return o.id; })
          => { 1: {id: 1}, 2: {id: 2}, 3: {id: 3} }
*/
function mapBy(collection, mapping) {
    var mapped = {};

    collection.forEach(function(object) {
        mapped[mapping(object)] = object;
    });

    return mapped;
}

module.exports = mapBy;
