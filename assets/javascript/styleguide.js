/**
    Scripts for the Loconomics Styleguide
**/

jQuery(escapeHtmlCodeSamples);

/**
    Prepare blocks of HTML code samples (elements 'code' with
    class 'html') to be scaped in order to being displayed as
    code rathern than as html.
**/
function escapeHtmlCodeSamples($){
    $('code.html').each(function() {
        var $t = $(this),
            code = $t.html();

        code = code.replace(/^\s*|\s*$/gm, '');
        $t.text(code);
    });
}
