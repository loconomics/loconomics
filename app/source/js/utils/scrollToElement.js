/**
    It scroll all needed elements in the page to make the
    target element to appear in the screen, if possible.

    It scrolls all the element ancestors (that may have
    or not a scrolling context).

    Only vertically.
    TODO: make it horizontal too.
**/
//global window
'use strict';

var $ = require('jquery');

// @param el:DOMElement|jQuery
// @param options:Object {
//      topOffset:int  Offset scroll from the top
// }
module.exports = function scrollToElement(el, options) {
    /* eslint complexity:"off" */
    el = (el instanceof $) ? el : $(el);

    var parent = $(el).parent();

    var topOffset = options && options.topOffset || 0;
    var animation = options && options.animation;

    var atRoot = false;

    do {
        // Go out on detached elements:
        if (!parent || !parent.length) return;
        // Check if root element (ends loop and has different rules for scrolling)
        // IMPORTANT: the root element that manages scrolling varies from browsers,
        // can be body or html (==document.documentElement), and even appling
        // two scrolling calculation (for each of them) may cause one bugs the other one.
        // Then, we detect 'html' or 'body' and apply the special logic.
        atRoot = parent.is('html,body');
        // TODO Research if the previous, new check, is valid at different situations,
        // like changing the CSS applied to html, body (positioning context),
        // different webengines and versions. In the past, the next check was done
        // resulting in two passes, one for each from html and body, and results
        // were a success;
        // but currently (#377) we had to ditch the next line in favor of that to
        // fix a bad behavior. The problem is that may breaks again in the future
        // if CSS layout changes are applied.
        //parent.get(0) === document.documentElement;

        var relativeTop = el.offset().top;
        // Relative position of the element is calculated in a different way
        // when at the root, so take care of that
        // TODO Research: in the same line of previous TODO comment, same situation
        // resulting in simplifying the calculation of the scrolling amount
        // to get it working again. Next line was used in the past with success,
        // but was part of the problem at #377
        //var relativeTop = atRoot ? el.position().top : el.offset().top;

        // IMPORTANT: elementTop with offset is used as is when atRoot
        // because the scrollingTop calculating make it fail (and is not correct
        // by the way --scrollingTop is calculated conditionally later)
        var elementTop = relativeTop - topOffset;

        if (atRoot) {
            // IMPORTANT: special case, on the root
            // we can just use window.scroll or scrollTop for animation
            // BUT with a different amount, the elementTop
            if (animation)
                $('html,body').stop().animate({ scrollTop: elementTop }, animation);
            else
                window.scroll(0, elementTop);
        }
        else {
            var scrollingTop = elementTop + parent.scrollTop() - parent.offset().top;
            if (animation)
                parent.stop().animate({ scrollTop: scrollingTop }, animation);
            else
                parent.scrollTop(scrollingTop);
        }

        parent = parent.parent();
    } while(!atRoot);
};
