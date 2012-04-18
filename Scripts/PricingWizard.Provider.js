function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)', 'i').exec(location.search) || [, null])[1]);
}

$(document).ready(function () {

    //Fill the Pricing Type drop down
    $('#pricingtype').addOption('', "Loading....").attr('disabled', true);
    $.getJSON(UrlUtil.LangPath + 'PricingWizard/ListPricingTypes/', function (data) {
        var estimatetypes = data.Result;
        $.each(estimatetypes, function (index, estimatetype) {
            var val = estimatetype.PricingTypeID;
            var text = estimatetype.Description;
            /*Debug
            End Debug*/

            $("#debugval").append(val);
            $("#debugtext").append(text);
            $('#pricingtype').addOption(val, text, false);
        });

        $('#pricingtype').addOption('', "Select type").attr('disabled', false);
        var firstselected = true;
        $('#pricingtype').change(function () {
            if (firstselected) {
                firstselected = false;
                $('#pricingtype').removeOption(0);
            };
        });

    });

    //Get the position ID from the queryString
    var positionID = getURLParameter("PositionID");
    
    //Paint the estimation vars
    $('#pricingtype').change(function () {

        var pricingTypeID = $('#pricingtype').val();

        //Reset the form
        $(".row").remove();

        $.getJSON(UrlUtil.LangPath + 'PricingWizard/GetProviderPricingVars/', { PositionID: positionID, PricingTypeID: pricingTypeID }, function (data) {
            var estimatevars = data.Result;
            $.each(estimatevars, function (index, estimatevar) {
                var varID = estimatevar.EstimateVarID; //indentifies a variable value
                var groupID = estimatevar.GroupID; //identifies a variable group for radio lists and dropdowns
                var name = estimatevar.ProviderDescription; //description showed to the user
                var tag = estimatevar.ProviderTag; //Tells wich Html representation should be painted(simple input, radio list, dropdown)
                var userTag = estimatevar.UserTag;
                var varValue = estimatevar.Value; //Default value for the variable.
                //Paint simple input
                if (tag == "input") {
                    if (!$('.label' + groupID).length) {
                        $('.inputfields').after('<div class="row"><label class="label' + groupID + '" for="varValue"><b>' + name + '<b/></label><div/>');
                    };
                    if (userTag != "input") {
                        $('.label' + groupID).after('<div class="row"><label class="row" for="inputvalue">' + varValue + '<label/><div/>');
                    };
                    $('.label' + groupID).after('<div class="row"><input type="hidden" id="varID" name="varID" value=' + varID + '><div/>');
                    $('.label' + groupID).after('<div class="row"><input class="inputValue" id="varValue" name="varValue" type="text"><div/>');
                };
                //Paint radio list input
                if (tag == "radiolist") {
                    if (!$('.label' + groupID).length) {
                        $('.inputfields').after('<div class="row"><label class="label' + groupID + '" for="listValue"><b>' + name + '<b/></label><div/>');
                        $('.label' + groupID).after('<input type="hidden" id="groupID" name="groupID" value=' + groupID + '>');
                    };
                    $('.label' + groupID).after('<div class="row"><label>' + value + '<label/><input type="radio" id="listValue" name="listValue" value=' + varID + '><div/>');
                };
                //Paint dropdown input
                if (tag == "dropdown") {
                    if (!$('.label' + groupID).length) {
                        $('.inputfields').after('<div class="row"><label class="label' + groupID + '" for="varValue"><b>' + name + '<b/></label><div/>');
                        $('.label' + groupID).after('<input type="hidden" id="groupID" name="groupID" value=' + groupID + '>');
                        $('.label' + groupID).after('<div class="row"><select class=select' + groupID + ' name="listValue" id="listValue"/><div/>');
                    };
                    $('.select' + groupID).addOption(varID, value, false);
                };
            });
        });

    });
});