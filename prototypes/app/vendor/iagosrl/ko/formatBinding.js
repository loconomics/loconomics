/* jshint maxcomplexity:14 */
/**
    Format extender for Knockout observables.
**/
'use strict';

var ko = require('knockout');
var $ = require('jquery');

/**
    The extender types are defined externally and registered
    in 'types' with each property the name of the type and the value
    the function implementing it.
**/
exports.types = {};

/**
    Knockout extender, to attach to ko.extenders with the desired
    name (for example: 'type' :-)
**/
exports.formatBinding = {
    update: function(element, valueAccessor, allBindings) {

        var options = ko.unwrap(valueAccessor()),
            value = ko.unwrap(allBindings.get('text'));
            
        applyFormat(value, element, options, ko.dataFor(element));

    }
};

function applyFormat(value, element, options, dataContext) {

    var type = ko.unwrap(options.type);

    if (type && type in exports.types) {

        var typeFormatter = exports.types[type];
        var str = typeFormatter.format(value, options, ko.dataFor(element));

        if ('html' in typeFormatter && typeFormatter.html === true)
            $(element).html(str);
        else
            $(element).text(str);
    }
}

/** Definition of several types */ 
exports.types.link = {
    html: true,
    format: function LinkFormatter(value, def, dataContext) {
    
        var link = def ? def.link ? def.link : def : null;
        link = typeof(link) === 'string' ? link : null;
        var r = value;
        
        if (link) {
            r = $('<a/>');
            
            var title = def ? def.title ? def.title : null : null,
                target = def ? def.target ? def.target : null : null;
            
            r.attr('href', link.replace(/__value__/g, value));
            if (title)
                r.attr('title', title.replace(/__value__/g, value));
            if (target)
                r.attr('target', target);
                
            // TODO: dataContext placeholders
            
            if (def.contentFormat) {
                applyFormat(value, r, def.contentFormat, dataContext);
            }
            else {
                r.text(value);
            }
            
            r = r.outerHtml();
        }

        return r;
    }
};

var moment = require('moment');
exports.types.datetime = {
    format: function DateTimeFormatter(value, def, dataContext) {
        var moment = require('moment');
        
        if (!value)
            return def.default || def.invalid || '';
        
        var dt = moment(value);
        return dt.isValid() ? dt.format(def.format) : def.invalid || '';
    }
};
    
exports.types.concat = {
    format: function ConcatFormatter(value, def, dataContext) {

        var fields = $.map(def.format, function(v, i) {
            // If is not a literal (between comiles), is a field
            // we need the value from the source and put it in the list
            var match = /["'](.*)["']/.exec(v);
            if (match && match.length > 1)
                return match[1];
            else
                return dataContext[v];
        });

        return fields.join('');
    }
};

var numeral = require('numeral');    
exports.types.number = {
    format: function NumberFormatter(value, def, dataContext) {
        var numeral = require('numeral');
        return numeral(value).format(def.format);
    }
};
    
exports.types.bool = {
    format: function BoolFormatter(value, def, dataContext) {
        var vs = def.values;
        if (!vs || vs.length !== 2)
            vs = ['true', 'false'];

        return value ? vs[0] : vs[1];
    }
};
