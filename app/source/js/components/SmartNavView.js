/**
    SmartNavView component.
    Requires its CSS counterpart.
    
    Adapted as common-js modules and class names.
    
    Forked from the project:
    
    Project-Tyson
    Website: https://github.com/c2prods/Project-Tyson
    Author: c2prods
    License:
    The MIT License (MIT)
    Copyright (c) 2013 c2prods
    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**/
var $ = function (query) { return document.querySelector(query); };
var $$ = function (query) { return document.querySelectorAll(query); };

var slideOpts = {
    sl:     ['slin',   'slout' ],    
    sr:     ['srin',   'srout' ],    
    popin:  ['popin',  'noanim'],    
    popout: ['noanim', 'popout'],    
};

var clearNode = function (node) {
    while(node.firstChild){
        node.removeChild(node.firstChild);
    }
};

var SwitchTabs = function () {
    var vIn = $('#'+this.dataset.vin),
        vOut = $('.SmartNavView.active'),
        vInCmd = this,
        vOutCmd = $('.SmartNavTabs button.active');
    vOut.classList.remove('active');
    vIn.classList.add('active');
    vOut.classList.add('hidden');
    vIn.classList.remove('hidden');
    vOutCmd.classList.remove('active');
    vInCmd.classList.add('active');
};

exports.SwitchTabs = SwitchTabs;

var Slide = function (callback) {
    var vIn = $('#'+this.dataset.vin),
        vOut = $('.SmartNavView.active'),
        slideType = this.dataset.sd,
        onAnimationEnd = function () {
            vOut.classList.add('hidden');
            vIn.classList.add('active');
            vIn.classList.remove(slideOpts[slideType][0]);
            vOut.classList.remove(slideOpts[slideType][1]);
            vOut.removeEventListener('webkitAnimationEnd', onAnimationEnd, false);
            vOut.removeEventListener('animationend',       onAnimationEnd);
        };
    vOut.addEventListener('webkitAnimationEnd', onAnimationEnd, false);
    vOut.addEventListener('animationend',       onAnimationEnd);
    if (callback && typeof(callback) === 'function') {
        callback();
    }
    vOut.classList.remove('active');
    vIn.classList.remove('hidden');
    vIn.classList.add(slideOpts[slideType][0]);
    vOut.classList.add(slideOpts[slideType][1]);
};

exports.Slide = Slide;

var ScrollTop = function () {
    var el = this.parentNode.parentNode.childNodes[5].childNodes[1],
        offset = el.scrollTop,
        interval = setInterval(function() {
            el.scrollTop = offset;
            offset -= 24; 
            if (offset <= -24) {
                clearInterval(interval);
            }
        }, 8);
};

exports.ScrollTop = ScrollTop;

var TextboxResize = function (el) {
    /* jshint maxstatements: 28, maxcomplexity:11 */
    
    el.removeEventListener('click', ScrollTop, false);
    el.addEventListener('click', ScrollTop, false);
    var leftbtn = el.parentNode.querySelectorAll('button.left')[0];
    var rightbtn = el.parentNode.querySelectorAll('button.right')[0];
    if (typeof leftbtn === 'undefined') {
        leftbtn = {
            offsetWidth: 0,
            className: ''
        };
    }
    if (typeof rightbtn === 'undefined') {
        rightbtn = {
            offsetWidth: 0,
            className: ''
        };
    }
    var margin = Math.max(leftbtn.offsetWidth, rightbtn.offsetWidth);
    el.style.marginLeft = margin + 'px';
    el.style.marginRight = margin + 'px';
    var tooLong = (el.offsetWidth < el.scrollWidth) ? true : false;
    if (tooLong) {
        if (leftbtn.offsetWidth < rightbtn.offsetWidth) {
            el.style.marginLeft = leftbtn.offsetWidth + 'px';
            el.style.textAlign = 'right';
        } else {
            el.style.marginRight = rightbtn.offsetWidth + 'px';
            el.style.textAlign = 'left';
        }
        tooLong = (el.offsetWidth<el.scrollWidth) ? true : false;
        if (tooLong) {
            if (new RegExp('arrow').test(leftbtn.className)) {
                clearNode(leftbtn.childNodes[1]);
                el.style.marginLeft = '26px';
            }
            if (new RegExp('arrow').test(rightbtn.className)) {
                clearNode(rightbtn.childNodes[1]);
                el.style.marginRight = '26px';
            }
        }
    }
};

exports.TextboxResize = TextboxResize;

exports.enableAll = function enableAll() {
    
    var i = 0;
    
    var textboxes = $$('.SmartNavBar h1');
    for (i = 0; i<textboxes.length; i++) TextboxResize(textboxes[i]);
    
    var navbtns = $$('.SmartNavBar button');
    for (i = 0; i<navbtns.length; i++) navbtns[i].addEventListener('click', Slide, false);

    var tabbtns = $$('.SmartNavTabs button');
    for (i = 0; i<tabbtns.length; i++) tabbtns[i].addEventListener('click', SwitchTabs, false);

    // Example of enable click on items that make a Slide
    //var listitems = $$('#view-home li');
    //for (var i = 0; i<listitems.length; i++) listitems[i].addEventListener('click', Slide, false);
};
