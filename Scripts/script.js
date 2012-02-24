/* Author: Loconomics */

$(document).ready(function(){

   // $('button[type=submit]').click(function(){
   //    $(this).closest('form').submit();
   //    return false;
   // })
	
	$('form input[type="text"]').focus(function() {
			if( this.value == this.defaultValue ) {
				this.value = "";
			}
		}).blur(function() {
			if( !this.value.length ) {
				this.value = this.defaultValue;
			}
	});
	
    // $('#loginButton').click(function() { 
    //     $('#loginModal').load('../en_US/Account/Login #container',function(){
    //        $.blockUI({ message: $('#loginModal'), css: { width: '375px' } }); 
    //     });
    //     return false;
    // }); 
    
    $('a#launchHowItWorks').click(function(event) { 
        event.preventDefault();
        $('div.blockUI.blockMsg.blockPage').addClass('fancy');
        $.blockUI({ 
           message: $('#howItWorksModal'),
           centerY: true, 
           css: { 
               top:  ($(window).height() - 550) /2 + 'px', 
               left: ($(window).width() - 400) /2 + 'px',
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
        
        $('.blockOverlay').attr('title','Click to unblock').click($.unblockUI);
    });
    	   

    $('#loginModal form input[type=submit]').click(function() { 
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

    $('#loginModal form input[type=cancel]').click(function() { 
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
	
	$('div.progress-bar').each(function(){
		var pd = $(this).find('.text .percent-done').text();
		$(this).find('.total .percent-done').css('width',pd);
	});

	// TODO dynamic stars 
	// $('table.ratings tr').each(function(){
	// 	var rating = $(this).find('span.stars').text();
	// 	var image = '<img src="img/star-on.gif" />';
	// 	$('this').find('td').append(image);
	// });
	
	
	// Autocomplete on User Supplied data
	$('#titleSearch').autocomplete('GetPositions.cshtml',{
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
		width: '230px',
		onSelect: function(event, ui){
			if ( $('#selectedTitles option').length < 5 ) {
				if ( $('#selectedTitles option:contains('+ui.data.display+')').length < 1 ){
					$('#selectedTitles').append('<option value="'+ui.data.value+'">'+ui.data.display+'</option>').removeClass('empty');
				}
				else { return false }
			}
			else { return false }
			$('#titleSearch').val('');
		}
	});
	
	// Trigger whole list
	$('#seeAllTitles').click(function(){
		$('#titleSearch').autoComplete('button.supply');
	});
	
	// Remove selected item
	$('#selectedTitles li').live('click',function(){
		$(this).remove();
		$('#titleSearch').focus();
	});
	
	// Date Picker
	$('.date-pick').datePicker().val(new Date().asString()).trigger('change');
	
	// Tabbed interface
	$('.tabbed').each(function(){
		
		// Establish which set of tabs we're dealing with
		var $parent = $(this);
		
		// Switch body when tab clicked
		$parent.children('.tabs').find('a').click(function(){
			if ( $(this).hasClass('current') ) { return false; }
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
    $('.autofill-submenu .current').each(function(){
        var parentmenu = $(this);
        // getting the submenu elementos from the tabs marked with class 'autofill-submenu-items'
        var items = $('.autofill-submenu-items li');
        // if there is items, create the submenu cloning it!
        if (items.length > 0){
            var submenu = document.createElement("ul");
            parentmenu.append(submenu);
            // Cloning without events:
            var newitems = items.clone(false, false);
            $(submenu).append(newitems);
            
            // We need attach events to maintain the tabbed interface working
            // New Items (cloned) must change tabs:
            newitems.find("a").click(function(){
                // Trigger event in the original item
                $("a[href='"+this.getAttribute("href")+"']", items).click();
                // Change menu:
                $(this).parent().parent().find("a").removeClass('current');
                $(this).addClass('current');
                // Stop event:
                return false;
            });
            // Original items must change menu:
            items.find("a").click(function(){
                newitems.parent().find("a").removeClass('current').
                filter("*[href='"+this.getAttribute("href")+"']").addClass('current');
            });
        }
        
        /** Dashboard Alerts carousel **/
        $('#dashboard-alerts').each(function(){
            var da = $(this);
            
            // We add the native array reverse function to jquery:
            $.fn.reverse = [].reverse;
            
            function routeAlerts(event){
                // Each row are 2 elements only
                var set = da.find('ul > li');
                
                // If needed, we reverse the collection to go previous instead next
                var anopts = {};
                if (event.data.reverse){
                    set.reverse();
                    anopts = {direction: 'left'};
                    anopth = {direction: 'right'};
                } else {
                    anopts = {direction: 'right'};
                    anopth = {direction: 'left'};
                }
                
                var v = 0;
                for(var i = 0; i < set.length; i++){
                    var seti = $(set[i]);               
                    
                    if(v < 2){
                        // Must be visible elements, and not last elements
                        if(seti.is(':visible') &&
                           i < set.length-2){
                            v++;
                            seti.hide();
                        }
                    } else if(v < 4){
                        v++;
                        seti.show();
                    } else if (v >= 4)
                        break;
                }
                return false;
            }
            
            da.find('.more.next').click({reverse: false}, routeAlerts);
            da.find('.more.previous').click({reverse: true}, routeAlerts);
        });
        $('#dashboard-alerts > ul > li').hide().slice(0, 2).show();
    });

});



