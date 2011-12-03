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
	
    $('#loginButton').click(function() { 
        $('#loginModal').load('../en_US/Account/Login #container',function(){
           $.blockUI({ message: $('#loginModal'), css: { width: '375px' } }); 
        });
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
				$parent.children('.tabs').find('a').removeClass('current');
				$parent.children('.tab-body').removeClass('current');
				var target = $(this).attr('href');
				$(this).addClass('current');
				$(target).addClass('current');
				return false;
			}
		});
	})

});



