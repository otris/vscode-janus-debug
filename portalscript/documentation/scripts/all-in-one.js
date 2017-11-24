$(function() {
    var keys = Object.keys(aioDatabase);
    var $mainDiv = $("#wrap .main");
    $(window).on("hashchange", function() {
        var key;
        if (!window.location.hash) {
            return;
        }
        keyArray = window.location.hash.split("&");
        key = keyArray[0].replace("#", "");
        if (keys.indexOf(key) !== -1) {
            // Replace main content and jump to #hash if defined
            $mainDiv.html(aioDatabase[key]);
            if (keyArray.length === 2) {
                $('html, body').animate({
                    scrollTop: $("#"+keyArray[1]).offset().top
                }, 300);                
            }
            else {
                $('html, body').animate({scrollTop: 0}, 300);                
            }
        }
    });
    
});