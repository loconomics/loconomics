/* Some utilities for use with jQuery or its expressions
    that are not plugins.
*/
function escapeJQuerySelectorValue(str) {
    return str.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/])/g, '\\$1')
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        escapeJQuerySelectorValue: escapeJQuerySelectorValue
    };
