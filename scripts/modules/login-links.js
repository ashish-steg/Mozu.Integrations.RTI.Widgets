require(['modules/jquery-mozu'], function ($) {

    function getUrlParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }
    
    var returnUrl = getUrlParameter('returnUrl');
    
    if(returnUrl) {
        var re = new RegExp('%2f', 'g');
        returnUrl = returnUrl.replace(re, '/');
        
        $('[name=returnUrl]').val(returnUrl);
    }
});




