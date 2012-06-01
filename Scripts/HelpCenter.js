/** HelpCenter specific script **/
$(document).ready(function () {
    $('#faqs a[href|="#FAQs"]').click(function () {
        var href = $(this).attr('href');
        var urlparts = href.split('-');
        var urlsection = '';
        if (urlparts.length > 1) {
            urlsection = urlparts[1];
        }
        urlsection += '#' + href;
        var urlprefix = "HelpCenter/$FAQs";
        if (urlsection)
            popup(UrlUtil.LangPath + urlprefix + urlsection, 'large');
        return false;
    });
});