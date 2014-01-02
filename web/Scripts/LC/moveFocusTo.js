function moveFocusTo(el, options) {
    options = $.extend({
        marginTop: 30
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, 500, null);
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = moveFocusTo;
}