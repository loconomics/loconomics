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
    //jshint maxcomplexity:10
    var parent = $(el).parent();

    var topOffset = options && options.topOffset || 0;
    var animation = options && options.animation;
    
    var atRoot = false;

    do {
        // Go out on detached elements:
        if (!parent || !parent.length) return;
        // Check if root element (ends loop and has different rules for scrolling)
        atRoot = parent.get(0) === document.documentElement;
        
        // Relative position of the element is calculated in a different way
        // when at the root, so take care of that
        var relativeTop = atRoot ? el.position().top : el.offset().top;
        
        // IMPORTANT: elementTop with offset is used as is when atRoot
        // because the next scrollingTop calculating make it fail
        var elementTop = relativeTop - topOffset;
        var scrollingTop = elementTop + parent.scrollTop() - parent.offset().top;

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
            if (animation)
                parent.stop().animate({ scrollTop: scrollingTop }, animation);
            else
                parent.scrollTop(scrollingTop);
        }

        parent = parent.parent();
    } while(!atRoot);
};
