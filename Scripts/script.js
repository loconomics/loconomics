/* Author: Loconomics */

/* Generic blockUI options sets */
var loadingBlock = { message: '<img src="' + UrlUtil.AppPath + 'img/loading.gif"/>' };
var errorBlock = function (error, reload) {
    return {
        css: { cursor: 'default' },
        message: 'There was an error'
            + (error ? ': ' + error : '')
            + (reload ? ' <a href="javascript: ' + reload + ';">Click to reload</a>' : '')
    }
};

/* Init code */
$(document).ready(function () {

    // $('button[type=submit]').click(function(){
    //    $(this).closest('form').submit();
    //    return false;
    // })

    $('form input[type="text"]').focus(function () {
        if (this.value == this.defaultValue) {
            this.value = "";
        }
    }).blur(function () {
        if (!this.value.length) {
            this.value = this.defaultValue;
        }
    });

    // $('#loginButton').click(function() { 
    //     $('#loginModal').load('../en_US/Account/Login #container',function(){
    //        $.blockUI({ message: $('#loginModal'), css: { width: '375px' } }); 
    //     });
    //     return false;
    // }); 

    $('a#launchHowItWorks').click(function (event) {
        event.preventDefault();
        $('div.blockUI.blockMsg.blockPage').addClass('fancy');
        $.blockUI({
            message: $('#howItWorksModal'),
            centerY: true,
            css: {
                top: ($(window).height() - 550) / 2 + 'px',
                left: ($(window).width() - 400) / 2 + 'px',
                width: '400px',
                padding: '25px',
                border: '5px solid #b5e1e2',
                '-moz-border-radius': '12px',
                '-webkit-border-radius': '12px',
                'border-radius': '12px',
                '-moz-background-clip': 'padding',
                '-webkit-background-clip': 'padding-box',
                'background-clip': 'padding-box'
            },
            overlayCSS: { cursor: 'default' }
        });

        $('.blockOverlay').attr('title', 'Click to unblock').click($.unblockUI);
    });


    $('#loginModal form input[type=submit]').click(function () {
        // update the block message 
        $.blockUI({ message: "<h1>Logging you in...</h1>" });
        // Ajax call should happen here
        // $.ajax({ 
        //     url: 'wait.php', 
        //     cache: false, 
        //     complete: function() { 
        //         // unblock when remote call returns 
        //         $.unblockUI(); 
        //     } 
        // }); 
    });

    $('#loginModal form input[type=cancel]').click(function () {
        $.unblockUI();
        return false;
    });

    // $('form input.password').focus(function() {
    // 	$(this).hide();
    // 	$(this).next('input').show().focus();
    // });
    // 
    // $('form input[type="password"]').blur(function(){
    // 	if ( this.value == "" ){
    // 		$(this).hide();
    // 		$(this).prev('input').show();
    // 	}
    // });

    $('div.progress-bar').each(function () {
        var pd = $(this).find('.text .percent-done').text();
        $(this).find('.total .percent-done').css('width', pd);
    });

    // TODO dynamic stars 
    // $('table.ratings tr').each(function(){
    // 	var rating = $(this).find('span.stars').text();
    // 	var image = '<img src="img/star-on.gif" />';
    // 	$('this').find('td').append(image);
    // });


    // Autocomplete on User Supplied data
    $('#titleSearch').autocomplete({ source: 'GetPositions.cshtml',
        // dataSupply: [
        // 	{value: 'housekeeper', display: 'housekeeper'}, 
        // 	{value: 'plumber', display: 'plumber'}, 
        // 	{value: 'carpenter', display: 'carpenter'}, 
        // 	{value: 'landscaper', display: 'landscaper'}, 
        // 	{value: 'babysitter', display: 'babysitter'}, 
        // 	{value: 'french', display: 'french tutor'}, 
        // 	{value: 'math', display: 'math tutor'}, 
        // 	{value: 'guitar', display: 'guitar lessons'}
        // ],
        /*width: '230px',*/
        select: function (event, ui) {
            if ($('#selectedTitles option').length < 5) {
                if ($('#selectedTitles option:contains(' + ui.data.display + ')').length < 1) {
                    $('#selectedTitles').append('<option value="' + ui.data.value + '">' + ui.data.display + '</option>').removeClass('empty');
                }
                else { return false }
            }
            else { return false }
            $('#titleSearch').val('');
        }
    });

    // Trigger whole list
    $('#seeAllTitles').click(function () {
        $('#titleSearch').autocomplete({ source: 'button.supply' });
    });

    // Remove selected item
    $('#selectedTitles li').live('click', function () {
        $(this).remove();
        $('#titleSearch').focus();
    });

    // Date Picker
    $.datepicker.setDefaults($.datepicker.regional[$('html').attr('lang')]);
    $(".date-pick")
        .val(new Date().asString($.datepicker._defaults.dateFormat))
        .datepicker({
            showOn: "button",
            buttonImage: "",
            buttonImageOnly: true,
            showAnim: "blind"
        });

    // Tabbed interface
    $('.tabbed').each(function () {

        // Establish which set of tabs we're dealing with
        var $parent = $(this);

        // Switch body when tab clicked
        $parent.children('.tabs').find('a').click(function () {
            if ($(this).hasClass('current') ||
                $(this).parent().hasClass('disabled'))
                return false;
            else {
                $parent.children('.tabs').find('li, a').removeClass('current');
                $parent.children('.tab-body').removeClass('current');
                var target = $(this).attr('href');
                $(this).addClass('current').parent().addClass('current');
                $(target).addClass('current');
                return false;
            }
        });
    });

    /** Auto-fill menu sub-items using tabbed pages -only works for current page items- **/
    $('.autofill-submenu .current').each(function () {
        var parentmenu = $(this);
        // getting the submenu elementos from the tabs marked with class 'autofill-submenu-items'
        var items = $('.autofill-submenu-items li');
        // if there is items, create the submenu cloning it!
        if (items.length > 0) {
            var submenu = document.createElement("ul");
            parentmenu.append(submenu);
            // Cloning without events:
            var newitems = items.clone(false, false);
            $(submenu).append(newitems);

            // We need attach events to maintain the tabbed interface working
            // New Items (cloned) must change tabs:
            newitems.find("a").click(function () {
                // Trigger event in the original item
                $("a[href='" + this.getAttribute("href") + "']", items).click();
                // Change menu:
                $(this).parent().parent().find("a").removeClass('current');
                $(this).addClass('current');
                // Stop event:
                return false;
            });
            // Original items must change menu:
            items.find("a").click(function () {
                newitems.parent().find("a").removeClass('current').
                filter("*[href='" + this.getAttribute("href") + "']").addClass('current');
            });
        }

        /** Dashboard Alerts carousel **/
        $('#dashboard-alerts').each(function () {
            var da = $(this);

            var ul = da.find('ul');
            var set = ul.find('li');
            var cont = $('<div></div>');
            cont.css('position', 'relative');
            cont.css('width', ul.width());
            cont.css('height', ul.height());
            cont.css('margin', 'auto');
            cont.css('overflow', 'hidden');
            cont.css('display', 'inline-block');
            ul.css('position', 'relative');
            ul.css('overflow', 'visible');
            ul.css('width', 'auto');
            ul.wrap(cont);
            var w = cont.width();

            function routeAlerts(event) {
                var p = ul.data('page') || 0;
                if (event.data.reverse)
                    p--;
                else
                    p++;

                if (p <= 0)
                    p = 0;
                else if (p + 1 >= ul.width() / w)
                    p = Math.round(ul.width() / w, 0) - 1;

                offl = (w + 3) * (0 - p);

                ul.data('page', p);

                ul.stop().animate({ left: offl }, { duration: 'fast' });
                return false;
            }

            da.find('.more.next').click({ reverse: false }, routeAlerts);
            da.find('.more.previous').click({ reverse: true }, routeAlerts);
        });
        //$('#dashboard-alerts > ul > li').hide().slice(0, 2).show();
    });

    /* Active/Desactive search filters */
    $(".buttons-list .button").click(function () { $(this).toggleClass('selected'); return false; });


    /* Activating Generic Wizard buttons */
    /* A link/button with next class and data-next-step attribute will contain an internal link of a tab that will
    * be activated where clicked. */
    $(".next").click(function () {
        var step = $(this).data('next-step');
        if (step) {
            if (/^#/.test(step)) {
                // Selecting the tab-body:
                var tb = $(step + '.tab-body');
                // Showing tab content, and hidden previous activated tab content:
                tb.addClass('current').siblings('.tab-body').removeClass('current');
                // Looking for the index of this step
                var ti = $('.tabbed > .tabs > li > a[href=' + step + ']')
                // desactivating previous selected tab (both, li and a elements)
                ti.parent().parent().find('li, a').removeClass('current');
                // activating selected tab index:
                ti.addClass('current').parent().addClass('current');
                return false;
            } else {
                // If there is a next-step URI that is not internal link, we load it by default
                window.location = step;
            }
        }
    });

    /* Wizard Tabbed Forms: ajax submit and next-step loading  */
    $("body").delegate(".tabbed.wizard .next", "click", function () {
        // getting the form
        var form = $(this).parents('form').eq(0);
        // getting the current wizard step-tab
        var currentStep = form.parents('.tab-body').eq(0);
        // getting the wizard container
        var wizard = form.parents('.tabbed.wizard').eq(0);
        // getting the wizard-next-step
        var nextStep = $(this).data('wizard-next-step');

        // Loading, with retard
        var loadingtimer = setTimeout(function () {
            currentStep.block(loadingBlock);
        }, 600);

        // Do the Ajax post
        $.post(
            (form.attr('action') || ''),
            form.serialize(),
        // On success:
            function (data, text, jx) {
                // If is a JSON result:
                if (typeof (data) === 'object') {
                    if (data.Result == 0) {
                        // If there is next-step
                        if (nextStep) {
                            // If next step is internal url (a next wizard tab)
                            if (/^#/.test(nextStep)) {
                                // Disabling the current step:
                                $('.tabs > li.current', wizard).addClass('disabled');
                                // Enabling the next step tab and showing it:
                                var a = $('.tabs > li > a[href=' + nextStep + ']', wizard);
                                a.parent().removeClass('disabled');
                                a.click();
                            } else {
                                // If there is a next-step URI that is not internal link, we load it
                                window.location = nextStep;
                            }
                        }
                    } else {
                        alert(data.ErrorMessage);
                    }
                } else {
                    // Post was wrong, html was returned to replace current form:
                    currentStep.html(data);
                }
                // Disable loading
                clearTimeout(loadingtimer);
                currentStep.unblock();
            }
        );
        return false;
    });

    /* Generic script for fieldsets with class .has-confirm, allowing show
    the content only if the main confirm fields have 'yes' selected */
    $("fieldset.has-confirm").each(function () {
        var fs = $(this);
        fs.find("> .confirm input").change(function () {
            var t = $(this);
            if (t.is(':checked'))
                if (t.val() == 'yes')
                    fs.removeClass('confirmed-no').addClass('confirmed-yes');
                else
                    fs.removeClass('confirmed-yes').addClass('confirmed-no');
        });
    });

    /* Generic script for help-point button, that will open the help-center at
    index or at specific page depending on the context
    ('.current' classes asigned and data-help-point="section" attribute or
    element id)
    */
    $(".help-point > a").click(function () {
        // We get the last 'current' element, that will be the deepest child with
        // .current setted.
        var c = $(".current:visible:last");
        // We save the path like an array
        var path = [];
        path.push(c.data('help-point'));
        // We look for parents with 'current' assigned, to get the full path
        c.parents('.current').each(function () {
            path.push($(this).data('help-point'));
        });
        // Building the relative url for help-center
        var rurl = path.reverse().join('');
        // If there is not 'data-help-point' values, we use the current element id to search,
        // or nothing (that means help center main page)
        if (!rurl) rurl = (c.attr('id') ? '?s=' + encodeURIComponent(c.attr('id')) : '');
        // Opening the help center
        popup(UrlUtil.LangPath + 'HelpCenter/' + rurl, 'large');
        // Do not allow browser to open the link url:
        return false;
    });
});

/* Popup function */
function popup(url, size){
    // Native popup
    //window.open(url);
    
    // Smart popup
    var s = (size == 'large' ? .8 : (size == 'medium' ? .5 : (size == 'small' ? .2 : size || .5 )));
    var width = Math.round($(window).width() * s);
    var height = Math.round($(window).height() * s);
    
    $('div.blockUI.blockMsg.blockPage').addClass('fancy');
    $.blockUI({ 
       message: '<img src="' + UrlUtil.AppPath + 'img/loading.gif"/>',
       centerY: false,
       css: {
           cursor: 'default',
           width: width + 'px',
           left: Math.round($(window).width() * (1-s)/2) - 30 + 'px',
           height: height + 'px',
           top: Math.round($(window).height() * (1-s)/2) - 30 + 'px',
           padding: '25px',
           overflow: 'auto',
           border: '5px solid #b5e1e2',
           '-moz-border-radius': '12px',
           '-webkit-border-radius': '12px',
           'border-radius': '12px',
           '-moz-background-clip': 'padding',
           '-webkit-background-clip': 'padding-box',
           'background-clip': 'padding-box'
       },
       overlayCSS: { cursor: 'default' }
    });

    // If url returns partial html (starts with $), is loaded with ajax and embedded in current document
    if (/((^\$)|(\/\$))/.test(url)) {
        // Loading Url with Ajax and place content inside the blocked-box
        $.ajax({ url: url, 
            success: function (data) {
                $('div.blockMsg').html(data);
            }, error: function (j, textStatus) {
                $('div.blockMsg').text('Page not found');
            }
        });
    } else {
        // If is full html url, is loaded inside an iframe
        var iframe = $('<iframe width="' + width + '" height="' + height + '" style="border:none;"></iframe>');
        // When the iframe is loaded, the loading image is removed and iframe showed
        iframe.bind('load', function () {
            $('div.blockMsg').children('img').remove();
            iframe.show();
        });
        // Hide iframe and load the url inside it:
        iframe.attr('src', url).hide();
        $('div.blockMsg').append(iframe);
    }
    
    $('.blockOverlay').attr('title','Click to unblock').click($.unblockUI);
}
