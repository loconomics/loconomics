/**
 * Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
 * IE9+
 */
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        var ancestor = this;
        if (!document.documentElement.contains(el)) return null;
        do {
            if (ancestor.matches(s)) return ancestor;
            ancestor = ancestor.parentElement;
        } while (ancestor !== null);
        return null;
    };
}
