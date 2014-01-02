/* Focus the first element in the document (or in @container)
with the html5 attribute 'autofocus' (or alternative @cssSelector).
It's fine as a polyfill and for ajax loaded content that will not
get the browser support of the attribute.
*/
function autoFocus(container, cssSelector) {
    container = $(container || document);
    container.find(cssSelector || '[autofocus]').focus();
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = autoFocus;