/**
 * Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
 * IE9+
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
                                Element.prototype.webkitMatchesSelector;
}
