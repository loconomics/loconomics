/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-borderradius-boxshadow-multiplebgs-opacity-rgba-textshadow-cssanimations-generatedcontent-draganddrop-history-input-inputtypes-touch-shiv-mq-cssclasses-addtest-prefixed-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-forms_placeholder-load
 */
;



window.Modernizr = (function( window, document, undefined ) {

    var version = '2.6.2',

    Modernizr = {},

    enableClasses = true,

    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  = document.createElement('input')  ,

    smile = ':)',

    toString = {}.toString,

    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),



    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),


    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, 


    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
                body = document.body,
                fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
                      while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

                style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
          (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
                fakeBody.style.background = '';
                fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
        if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },

    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq).matches;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
 

    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

            var isSupported = eventName in element;

        if ( !isSupported ) {
                if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

                    if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),


    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { 
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }

    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }

    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

            if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

            } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };



    tests['rgba'] = function() {
        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };


    tests['multiplebgs'] = function() {
                setCss('background:url(https://),url(https://),red url(https://)');

            return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };



    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
                setCssAll('opacity:.55');

                    return (/^0.55$/).test(mStyle.opacity);
    };


    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };

    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };
    function webforms() {
                                            Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
                                  attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
                            Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                                                    if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                                        bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                                                                                  (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                                                                                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                                        bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                                        bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        }
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    Modernizr.input || webforms();


     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
                                              return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; 
     };


    setCss('');
    modElem = inputElem = null;

    ;(function(window, document) {
        var options = window.html5 || {};

        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        var supportsHtml5Styles;

        var expando = '_html5shiv';

        var expanID = 0;

        var expandoData = {};

        var supportsUnknownElements;

      (function() {
        try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
                    supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
                        (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
        } catch(e) {
          supportsHtml5Styles = true;
          supportsUnknownElements = true;
        }

      }());        function addStyleSheet(ownerDocument, cssText) {
        var p = ownerDocument.createElement('p'),
            parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

        p.innerHTML = 'x<style>' + cssText + '</style>';
        return parent.insertBefore(p.lastChild, parent.firstChild);
      }

        function getElements() {
        var elements = html5.elements;
        return typeof elements == 'string' ? elements.split(' ') : elements;
      }

          function getExpandoData(ownerDocument) {
        var data = expandoData[ownerDocument[expando]];
        if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
        }
        return data;
      }

        function createElement(nodeName, ownerDocument, data){
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
        }
        if (!data) {
            data = getExpandoData(ownerDocument);
        }
        var node;

        if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
        } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
        } else {
            node = data.createElem(nodeName);
        }

                                    return node.canHaveChildren && !reSkip.test(nodeName) ? data.frag.appendChild(node) : node;
      }

        function createDocumentFragment(ownerDocument, data){
        if (!ownerDocument) {
            ownerDocument = document;
        }
        if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
        }
        data = data || getExpandoData(ownerDocument);
        var clone = data.frag.cloneNode(),
            i = 0,
            elems = getElements(),
            l = elems.length;
        for(;i<l;i++){
            clone.createElement(elems[i]);
        }
        return clone;
      }

        function shivMethods(ownerDocument, data) {
        if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
        }


        ownerDocument.createElement = function(nodeName) {
                if (!html5.shivMethods) {
              return data.createElem(nodeName);
          }
          return createElement(nodeName, ownerDocument, data);
        };

        ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
          'var n=f.cloneNode(),c=n.createElement;' +
          'h.shivMethods&&(' +
                    getElements().join().replace(/\w+/g, function(nodeName) {
              data.createElem(nodeName);
              data.frag.createElement(nodeName);
              return 'c("' + nodeName + '")';
            }) +
          ');return n}'
        )(html5, data.frag);
      }        function shivDocument(ownerDocument) {
        if (!ownerDocument) {
            ownerDocument = document;
        }
        var data = getExpandoData(ownerDocument);

        if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
          data.hasCSS = !!addStyleSheet(ownerDocument,
                    'article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}' +
                    'mark{background:#FF0;color:#000}'
          );
        }
        if (!supportsUnknownElements) {
          shivMethods(ownerDocument, data);
        }
        return ownerDocument;
      }        var html5 = {

            'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video',

            'shivCSS': (options.shivCSS !== false),

            'supportsUnknownElements': supportsUnknownElements,

            'shivMethods': (options.shivMethods !== false),

            'type': 'default',

            'shivDocument': shivDocument,

            createElement: createElement,

            createDocumentFragment: createDocumentFragment
      };        window.html5 = html5;

        shivDocument(document);

    }(this, document));

    Modernizr._version      = version;

    Modernizr._prefixes     = prefixes;
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;

    Modernizr.mq            = testMediaQuery;

    Modernizr.hasEvent      = isEventSupported;

    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };

    Modernizr.testAllProps  = testPropsAll;


    Modernizr.testStyles    = injectElementWithStyles;
    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
            return testPropsAll(prop, obj, elem);
      }
    };


    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                                                    (enableClasses ? ' js ' + classes.join(' ') : '');

    return Modernizr;

})(this, this.document);
/*yepnope1.5.4|WTFPL*/
//(function (a, b, c) { function d(a) { return "[object Function]" == o.call(a) } function e(a) { return "string" == typeof a } function f() { } function g(a) { return !a || "loaded" == a || "complete" == a || "uninitialized" == a } function h() { var a = p.shift(); q = 1, a ? a.t ? m(function () { ("c" == a.t ? B.injectCss : B.injectJs)(a.s, 0, a.a, a.x, a.e, 1) }, 0) : (a(), h()) : q = 0 } function i(a, c, d, e, f, i, j) { function k(b) { if (!o && g(l.readyState) && (u.r = o = 1, !q && h(), l.onload = l.onreadystatechange = null, b)) { "img" != a && m(function () { t.removeChild(l) }, 50); for (var d in y[c]) y[c].hasOwnProperty(d) && y[c][d].onload() } } var j = j || B.errorTimeout, l = b.createElement(a), o = 0, r = 0, u = { t: d, s: c, e: f, a: i, x: j }; 1 === y[c] && (r = 1, y[c] = []), "object" == a ? l.data = c : (l.src = c, l.type = a), l.width = l.height = "0", l.onerror = l.onload = l.onreadystatechange = function () { k.call(this, r) }, p.splice(e, 0, u), "img" != a && (r || 2 === y[c] ? (t.insertBefore(l, s ? null : n), m(k, j)) : y[c].push(l)) } function j(a, b, c, d, f) { return q = 0, b = b || "j", e(a) ? i("c" == b ? v : u, a, b, this.i++, c, d, f) : (p.splice(this.i++, 0, a), 1 == p.length && h()), this } function k() { var a = B; return a.loader = { load: j, i: 0 }, a } var l = b.documentElement, m = a.setTimeout, n = b.getElementsByTagName("script")[0], o = {}.toString, p = [], q = 0, r = "MozAppearance" in l.style, s = r && !!b.createRange().compareNode, t = s ? l : n.parentNode, l = a.opera && "[object Opera]" == o.call(a.opera), l = !!b.attachEvent && !l, u = r ? "object" : l ? "script" : "img", v = l ? "script" : u, w = Array.isArray || function (a) { return "[object Array]" == o.call(a) }, x = [], y = {}, z = { timeout: function (a, b) { return b.length && (a.timeout = b[0]), a } }, A, B; B = function (a) { function b(a) { var a = a.split("!"), b = x.length, c = a.pop(), d = a.length, c = { url: c, origUrl: c, prefixes: a }, e, f, g; for (f = 0; f < d; f++) g = a[f].split("="), (e = z[g.shift()]) && (c = e(c, g)); for (f = 0; f < b; f++) c = x[f](c); return c } function g(a, e, f, g, h) { var i = b(a), j = i.autoCallback; i.url.split(".").pop().split("?").shift(), i.bypass || (e && (e = d(e) ? e : e[a] || e[g] || e[a.split("/").pop().split("?")[0]]), i.instead ? i.instead(a, e, f, g, h) : (y[i.url] ? i.noexec = !0 : y[i.url] = 1, f.load(i.url, i.forceCSS || !i.forceJS && "css" == i.url.split(".").pop().split("?").shift() ? "c" : c, i.noexec, i.attrs, i.timeout), (d(e) || d(j)) && f.load(function () { k(), e && e(i.origUrl, h, g), j && j(i.origUrl, h, g), y[i.url] = 2 }))) } function h(a, b) { function c(a, c) { if (a) { if (e(a)) c || (j = function () { var a = [].slice.call(arguments); k.apply(this, a), l() }), g(a, j, b, 0, h); else if (Object(a) === a) for (n in m = function () { var b = 0, c; for (c in a) a.hasOwnProperty(c) && b++; return b } (), a) a.hasOwnProperty(n) && (!c && ! --m && (d(j) ? j = function () { var a = [].slice.call(arguments); k.apply(this, a), l() } : j[n] = function (a) { return function () { var b = [].slice.call(arguments); a && a.apply(this, b), l() } } (k[n])), g(a[n], j, b, n, h)) } else !c && l() } var h = !!a.test, i = a.load || a.both, j = a.callback || f, k = j, l = a.complete || f, m, n; c(h ? a.yep : a.nope, !!i), i && c(i) } var i, j, l = this.yepnope.loader; if (e(a)) g(a, 0, l, 0); else if (w(a)) for (i = 0; i < a.length; i++) j = a[i], e(j) ? g(j, 0, l, 0) : w(j) ? B(j) : Object(j) === j && h(j, l); else Object(a) === a && h(a, l) }, B.addPrefix = function (a, b) { z[a] = b }, B.addFilter = function (a) { x.push(a) }, B.errorTimeout = 1e4, null == b.readyState && b.addEventListener && (b.readyState = "loading", b.addEventListener("DOMContentLoaded", A = function () { b.removeEventListener("DOMContentLoaded", A, 0), b.readyState = "complete" }, 0)), a.yepnope = k(), a.yepnope.executeStack = h, a.yepnope.injectJs = function (a, c, d, e, i, j) { var k = b.createElement("script"), l, o, e = e || B.errorTimeout; k.src = a; for (o in d) k.setAttribute(o, d[o]); c = j ? h : c || f, k.onreadystatechange = k.onload = function () { !l && g(k.readyState) && (l = 1, c(), k.onload = k.onreadystatechange = null) }, m(function () { l || (l = 1, c(1)) }, e), i ? k.onload() : n.parentNode.insertBefore(k, n) }, a.yepnope.injectCss = function (a, c, d, e, g, i) { var e = b.createElement("link"), j, c = i ? h : c || f; e.href = a, e.rel = "stylesheet", e.type = "text/css"; for (j in d) e.setAttribute(j, d[j]); g || (n.parentNode.insertBefore(e, n), m(c, 0)) } })(this, document);
// yepnope.js
// Version - 1.5.4
//
// by
// Alex Sexton - @SlexAxton - AlexSexton[at]gmail.com
// Ralph Holzmann - @ralphholzmann - ralphholzmann[at]gmail.com
//
// http://yepnopejs.com/
// https://github.com/SlexAxton/yepnope.js/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.
// Also available as Modernizr.load via the Modernizr Project
//
(function (window, doc, undef) {

    var docElement = doc.documentElement,
    sTimeout = window.setTimeout,
    firstScript = doc.getElementsByTagName("script")[0],
    toString = {}.toString,
    execStack = [],
    started = 0,
    noop = function () { },
    // Before you get mad about browser sniffs, please read:
    // https://github.com/Modernizr/Modernizr/wiki/Undetectables
    // If you have a better solution, we are actively looking to solve the problem
    isGecko = ("MozAppearance" in docElement.style),
    isGeckoLTE18 = isGecko && !!doc.createRange().compareNode,
    insBeforeObj = isGeckoLTE18 ? docElement : firstScript.parentNode,
    // Thanks to @jdalton for showing us this opera detection (by way of @kangax) (and probably @miketaylr too, or whatever...)
    isOpera = window.opera && toString.call(window.opera) == "[object Opera]",
    isIE = !!doc.attachEvent && !isOpera,
    strJsElem = isGecko ? "object" : isIE ? "script" : "img",
    strCssElem = isIE ? "script" : strJsElem,
    isArray = Array.isArray || function (obj) {
        return toString.call(obj) == "[object Array]";
    },
    isObject = function (obj) {
        return Object(obj) === obj;
    },
    isString = function (s) {
        return typeof s == "string";
    },
    isFunction = function (fn) {
        return toString.call(fn) == "[object Function]";
    },
    globalFilters = [],
    scriptCache = {},
    prefixes = {
        // key value pair timeout options
        timeout: function (resourceObj, prefix_parts) {
            if (prefix_parts.length) {
                resourceObj['timeout'] = prefix_parts[0];
            }
            return resourceObj;
        }
    },
    handler,
    yepnope;

    /* Loader helper functions */
    function isFileReady(readyState) {
        // Check to see if any of the ways a file can be ready are available as properties on the file's element
        return (!readyState || readyState == "loaded" || readyState == "complete" || readyState == "uninitialized");
    }


    // Takes a preloaded js obj (changes in different browsers) and injects it into the head
    // in the appropriate order
    function injectJs(src, cb, attrs, timeout, /* internal use */err, internal) {
        var script = doc.createElement("script"),
        done, i;

        timeout = timeout || yepnope['errorTimeout'];

        script.src = src;

        // Add our extra attributes to the script element
        for (i in attrs) {
            script.setAttribute(i, attrs[i]);
        }

        cb = internal ? executeStack : (cb || noop);

        // Bind to load events
        script.onreadystatechange = script.onload = function () {

            if (!done && isFileReady(script.readyState)) {

                // Set done to prevent this function from being called twice.
                done = 1;
                cb();

                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
            }
        };

        // 404 Fallback
        sTimeout(function () {
            if (!done) {
                done = 1;
                // Might as well pass in an error-state if we fire the 404 fallback
                cb(1);
            }
        }, timeout);

        // Inject script into to document
        // or immediately callback if we know there
        // was previously a timeout error
        err ? script.onload() : firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Takes a preloaded css obj (changes in different browsers) and injects it into the head
    function injectCss(href, cb, attrs, timeout, /* Internal use */err, internal) {

        // Create stylesheet link
        var link = doc.createElement("link"),
        done, i;

        timeout = timeout || yepnope['errorTimeout'];

        cb = internal ? executeStack : (cb || noop);

        // Add attributes
        link.href = href;
        link.rel = "stylesheet";
        link.type = "text/css";

        // Add our extra attributes to the link element
        for (i in attrs) {
            link.setAttribute(i, attrs[i]);
        }

        if (!err) {
            firstScript.parentNode.insertBefore(link, firstScript);
            sTimeout(cb, 0);
        }
    }

    function executeStack() {
        // shift an element off of the stack
        var i = execStack.shift();
        started = 1;

        // if a is truthy and the first item in the stack has an src
        if (i) {
            // if it's a script, inject it into the head with no type attribute
            if (i['t']) {
                // Inject after a timeout so FF has time to be a jerk about it and
                // not double load (ignore the cache)
                sTimeout(function () {
                    (i['t'] == "c" ? yepnope['injectCss'] : yepnope['injectJs'])(i['s'], 0, i['a'], i['x'], i['e'], 1);
                }, 0);
            }
            // Otherwise, just call the function and potentially run the stack
            else {
                i();
                executeStack();
            }
        }
        else {
            // just reset out of recursive mode
            started = 0;
        }
    }

    function preloadFile(elem, url, type, splicePoint, dontExec, attrObj, timeout) {

        timeout = timeout || yepnope['errorTimeout'];

        // Create appropriate element for browser and type
        var preloadElem = doc.createElement(elem),
        done = 0,
        firstFlag = 0,
        stackObject = {
            "t": type,     // type
            "s": url,      // src
            //r: 0,        // ready
            "e": dontExec, // set to true if we don't want to reinject
            "a": attrObj,
            "x": timeout
        };

        // The first time (common-case)
        if (scriptCache[url] === 1) {
            firstFlag = 1;
            scriptCache[url] = [];
        }

        function onload(first) {
            // If the script/css file is loaded
            if (!done && isFileReady(preloadElem.readyState)) {

                // Set done to prevent this function from being called twice.
                stackObject['r'] = done = 1;

                !started && executeStack();

                // Handle memory leak in IE
                preloadElem.onload = preloadElem.onreadystatechange = null;
                if (first) {
                    if (elem != "img") {
                        sTimeout(function () { insBeforeObj.removeChild(preloadElem) }, 50);
                    }

                    for (var i in scriptCache[url]) {
                        if (scriptCache[url].hasOwnProperty(i)) {
                            scriptCache[url][i].onload();
                        }
                    }
                }
            }
        }


        // Setting url to data for objects or src for img/scripts
        if (elem == "object") {
            preloadElem.data = url;
        } else {
            preloadElem.src = url;

            // Setting bogus script type to allow the script to be cached
            preloadElem.type = elem;
        }

        // Don't let it show up visually
        preloadElem.width = preloadElem.height = "0";

        // Attach handlers for all browsers
        preloadElem.onerror = preloadElem.onload = preloadElem.onreadystatechange = function () {
            onload.call(this, firstFlag);
        };
        // inject the element into the stack depending on if it's
        // in the middle of other scripts or not
        execStack.splice(splicePoint, 0, stackObject);

        // The only place these can't go is in the <head> element, since objects won't load in there
        // so we have two options - insert before the head element (which is hard to assume) - or
        // insertBefore technically takes null/undefined as a second param and it will insert the element into
        // the parent last. We try the head, and it automatically falls back to undefined.
        if (elem != "img") {
            // If it's the first time, or we've already loaded it all the way through
            if (firstFlag || scriptCache[url] === 2) {
                insBeforeObj.insertBefore(preloadElem, isGeckoLTE18 ? null : firstScript);

                // If something fails, and onerror doesn't fire,
                // continue after a timeout.
                sTimeout(onload, timeout);
            }
            else {
                // instead of injecting, just hold on to it
                scriptCache[url].push(preloadElem);
            }
        }
    }

    function load(resource, type, dontExec, attrObj, timeout) {
        // If this method gets hit multiple times, we should flag
        // that the execution of other threads should halt.
        started = 0;

        // We'll do 'j' for js and 'c' for css, yay for unreadable minification tactics
        type = type || "j";
        if (isString(resource)) {
            // if the resource passed in here is a string, preload the file
            preloadFile(type == "c" ? strCssElem : strJsElem, resource, type, this['i']++, dontExec, attrObj, timeout);
        } else {
            // Otherwise it's a callback function and we can splice it into the stack to run
            execStack.splice(this['i']++, 0, resource);
            execStack.length == 1 && executeStack();
        }

        // OMG is this jQueries? For chaining...
        return this;
    }

    // return the yepnope object with a fresh loader attached
    function getYepnope() {
        var y = yepnope;
        y['loader'] = {
            "load": load,
            "i": 0
        };
        return y;
    }

    /* End loader helper functions */
    // Yepnope Function
    yepnope = function (needs) {

        var i,
        need,
        // start the chain as a plain instance
        chain = this['yepnope']['loader'];

        function satisfyPrefixes(url) {
            // split all prefixes out
            var parts = url.split("!"),
      gLen = globalFilters.length,
      origUrl = parts.pop(),
      pLen = parts.length,
      res = {
          "url": origUrl,
          // keep this one static for callback variable consistency
          "origUrl": origUrl,
          "prefixes": parts
      },
      mFunc,
      j,
      prefix_parts;

            // loop through prefixes
            // if there are none, this automatically gets skipped
            for (j = 0; j < pLen; j++) {
                prefix_parts = parts[j].split('=');
                mFunc = prefixes[prefix_parts.shift()];
                if (mFunc) {
                    res = mFunc(res, prefix_parts);
                }
            }

            // Go through our global filters
            for (j = 0; j < gLen; j++) {
                res = globalFilters[j](res);
            }

            // return the final url
            return res;
        }

        function getExtension(url) {
            return url.split(".").pop().split("?").shift();
        }

        function loadScriptOrStyle(input, callback, chain, index, testResult) {
            // run through our set of prefixes
            var resource = satisfyPrefixes(input),
          autoCallback = resource['autoCallback'],
          extension = getExtension(resource['url']);

            // if no object is returned or the url is empty/0 just exit the load
            if (resource['bypass']) {
                return;
            }

            // Determine callback, if any
            if (callback) {
                callback = isFunction(callback) ?
          callback :
          callback[input] ||
          callback[index] ||
          callback[(input.split("/").pop().split("?")[0])];
            }

            // if someone is overriding all normal functionality
            if (resource['instead']) {
                return resource['instead'](input, callback, chain, index, testResult);
            }
            else {
                // Handle if we've already had this url and it's completed loaded already
                if (scriptCache[resource['url']]) {
                    // don't let this execute again
                    resource['noexec'] = true;
                }
                else {
                    scriptCache[resource['url']] = 1;
                }

                // Throw this into the queue
                chain.load(resource['url'], ((resource['forceCSS'] || (!resource['forceJS'] && "css" == getExtension(resource['url'])))) ? "c" : undef, resource['noexec'], resource['attrs'], resource['timeout']);

                // If we have a callback, we'll start the chain over
                if (isFunction(callback) || isFunction(autoCallback)) {
                    // Call getJS with our current stack of things
                    chain['load'](function () {
                        // Hijack yepnope and restart index counter
                        getYepnope();
                        // Call our callbacks with this set of data
                        callback && callback(resource['origUrl'], testResult, index);
                        autoCallback && autoCallback(resource['origUrl'], testResult, index);

                        // Override this to just a boolean positive
                        scriptCache[resource['url']] = 2;
                    });
                }
            }
        }

        function loadFromTestObject(testObject, chain) {
            var testResult = !!testObject['test'],
            group = testResult ? testObject['yep'] : testObject['nope'],
            always = testObject['load'] || testObject['both'],
            callback = testObject['callback'] || noop,
            cbRef = callback,
            complete = testObject['complete'] || noop,
            needGroupSize,
            callbackKey;

            // Reusable function for dealing with the different input types
            // NOTE:: relies on closures to keep 'chain' up to date, a bit confusing, but
            // much smaller than the functional equivalent in this case.
            function handleGroup(needGroup, moreToCome) {
                if (!needGroup) {
                    // Call the complete callback when there's nothing to load.
                    !moreToCome && complete();
                }
                // If it's a string
                else if (isString(needGroup)) {
                    // if it's a string, it's the last
                    if (!moreToCome) {
                        // Add in the complete callback to go at the end
                        callback = function () {
                            var args = [].slice.call(arguments);
                            cbRef.apply(this, args);
                            complete();
                        };
                    }
                    // Just load the script of style
                    loadScriptOrStyle(needGroup, callback, chain, 0, testResult);
                }
                // See if we have an object. Doesn't matter if it's an array or a key/val hash
                // Note:: order cannot be guaranteed on an key value object with multiple elements
                // since the for-in does not preserve order. Arrays _should_ go in order though.
                else if (isObject(needGroup)) {
                    // I hate this, but idk another way for objects.
                    needGroupSize = (function () {
                        var count = 0, i
                        for (i in needGroup) {
                            if (needGroup.hasOwnProperty(i)) {
                                count++;
                            }
                        }
                        return count;
                    })();

                    for (callbackKey in needGroup) {
                        // Safari 2 does not have hasOwnProperty, but not worth the bytes for a shim
                        // patch if needed. Kangax has a nice shim for it. Or just remove the check
                        // and promise not to extend the object prototype.
                        if (needGroup.hasOwnProperty(callbackKey)) {
                            // Find the last added resource, and append to it's callback.
                            if (!moreToCome && !(--needGroupSize)) {
                                // If this is an object full of callbacks
                                if (!isFunction(callback)) {
                                    // Add in the complete callback to go at the end
                                    callback[callbackKey] = (function (innerCb) {
                                        return function () {
                                            var args = [].slice.call(arguments);
                                            innerCb && innerCb.apply(this, args);
                                            complete();
                                        };
                                    })(cbRef[callbackKey]);
                                }
                                // If this is just a single callback
                                else {
                                    callback = function () {
                                        var args = [].slice.call(arguments);
                                        cbRef.apply(this, args);
                                        complete();
                                    };
                                }
                            }
                            loadScriptOrStyle(needGroup[callbackKey], callback, chain, callbackKey, testResult);
                        }
                    }
                }
            }

            // figure out what this group should do
            handleGroup(group, !!always);

            // Run our loader on the load/both group too
            // the always stuff always loads second.
            always && handleGroup(always);
        }

        // Someone just decides to load a single script or css file as a string
        if (isString(needs)) {
            loadScriptOrStyle(needs, 0, chain, 0);
        }
        // Normal case is likely an array of different types of loading options
        else if (isArray(needs)) {
            // go through the list of needs
            for (i = 0; i < needs.length; i++) {
                need = needs[i];

                // if it's a string, just load it
                if (isString(need)) {
                    loadScriptOrStyle(need, 0, chain, 0);
                }
                // if it's an array, call our function recursively
                else if (isArray(need)) {
                    yepnope(need);
                }
                // if it's an object, use our modernizr logic to win
                else if (isObject(need)) {
                    loadFromTestObject(need, chain);
                }
            }
        }
        // Allow a single object to be passed in
        else if (isObject(needs)) {
            loadFromTestObject(needs, chain);
        }
    };

    // This publicly exposed function is for allowing
    // you to add functionality based on prefixes on the
    // string files you add. 'css!' is a builtin prefix
    //
    // The arguments are the prefix (not including the !) as a string
    // and
    // A callback function. This function is passed a resource object
    // that can be manipulated and then returned. (like middleware. har.)
    //
    // Examples of this can be seen in the officially supported ie prefix
    yepnope['addPrefix'] = function (prefix, callback) {
        prefixes[prefix] = callback;
    };

    // A filter is a global function that every resource
    // object that passes through yepnope will see. You can
    // of course conditionally choose to modify the resource objects
    // or just pass them along. The filter function takes the resource
    // object and is expected to return one.
    //
    // The best example of a filter is the 'autoprotocol' officially
    // supported filter
    yepnope['addFilter'] = function (filter) {
        globalFilters.push(filter);
    };

    // Default error timeout to 10sec - modify to alter
    yepnope['errorTimeout'] = 1e4;

    // Webreflection readystate hack
    // safe for jQuery 1.4+ ( i.e. don't use yepnope with jQuery 1.3.2 )
    // if the readyState is null and we have a listener
    if (doc.readyState == null && doc.addEventListener) {
        // set the ready state to loading
        doc.readyState = "loading";
        // call the listener
        doc.addEventListener("DOMContentLoaded", handler = function () {
            // Remove the listener
            doc.removeEventListener("DOMContentLoaded", handler, 0);
            // Set it to ready
            doc.readyState = "complete";
        }, 0);
    }

    // Attach loader &
    // Leak it
    window['yepnope'] = getYepnope();

    // Exposing executeStack to better facilitate plugins
    window['yepnope']['executeStack'] = executeStack;
    window['yepnope']['injectJs'] = injectJs;
    window['yepnope']['injectCss'] = injectCss;

})(this, document);

Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0));};
// testing for placeholder attribute in inputs and textareas
// re-using Modernizr.input if available

Modernizr.addTest('placeholder', function(){

  return !!( 'placeholder' in ( Modernizr.input    || document.createElement('input')    ) && 
             'placeholder' in ( Modernizr.textarea || document.createElement('textarea') )
           );

});
;