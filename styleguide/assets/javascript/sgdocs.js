/**
    Scripts for the Loconomics Styleguide
**/

var jQuery = require('jquery');
jQuery(escapeHtmlCodeSamples);

/**
    Prepare blocks of HTML code samples (elements 'code' with
    class 'html') to be scaped in order to being displayed as
    code rather than as html.
**/
function escapeHtmlCodeSamples($){
    $('code.html').each(function() {
        var $t = $(this),
            code = $t.html();

        // Remove any blank line on beggining and ending
        code = code.replace(/^\s*\n|\s*\n?$/gm, '');
        
        // Remove indentation of the code example in the original source
        // but preserving indentation from the first element in the sample:
        var m = code.match(/^(\s+)/);
        if (m && m[0])
            code = code.replace(new RegExp('^' + m[0], 'gm'), '');

        // Encoding :-)
        $t.text(code);
    });
}
