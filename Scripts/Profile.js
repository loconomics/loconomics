/* TODO doc */
$(function () {
    $("#customerName").hide();
    $("#PositionID").hide();
    $("#ProviderID").hide();
    $("#PositionSingular").hide();

    /* Photos (MyWork) selection: */
    $('.position-tab > .mywork').on('click', '.photo-library li a', function () {
        var $t = $(this);
        var cont = $t.closest('.mywork');
        var hlPanel = $('.gallery-highlighted', cont);

        // Set this photo as selected
        var selected = $t.closest('li');
        selected.addClass('selected').siblings().removeClass('selected');
        if (selected != null && selected.length > 0) {
            var selImg = selected.find('img');
            // Moving selected to be highlighted panel
            hlPanel.find('img').attr('src', selImg.attr('src'));
            var caption = selImg.attr('alt');
            hlPanel.find('img').attr('alt', caption);
            hlPanel.find('.photo-caption').text(caption);
        }
        return false;
    });

    /* Report unauthorized use */
    $('.report-action').click(function () {
        switch (this.getAttribute('href')) {
            case '#report-unauthorized-use':
                var reportedUserID = $(this).data('reported-userid');
                popup(UrlUtil.LangPath + 'Messaging/$ReportUnauthorizedUse/?ReportedUserID=' + reportedUserID, 'medium');
                return false;
        }
    });

    /* User verifications and licenses */
    $('.user-verifications-licenses').on('click', '.view-details-action', function () {
        var $t = $(this);
        smoothBoxBlock($t.siblings('.view-details-popup').clone(), $t.closest('.tab-body'), null, { closable: true });
        return false;
    });
});
