require([
    'modules/jquery-mozu',
    'modules/models-cart',
    'modules/backbone-mozu',
    'modules/cart-monitor',
    'vendor/jquery/lazysizes-custom.min'
    ], 
function($, CartModels, Backbone, CartMonitor) {
    var heightScreen = $(".mz-pageheader").height();
    var user = require.mozuData('user');
    if(!user.isAnonymous) {
        $('#user-initials').text(user.firstName.substring(0, 1) + user.lastName.substring(0, 1));
    }

    if(require.mozuData('pagecontext').isEditMode) {
        $(".mz-homepageheader,.mz-pageheader").addClass("white-bg");
    } else {
        $(window).scroll(function() {
        /*home page header*/
        if($(this).scrollTop() > 0) {
            $(".mz-homepageheader,.mz-pageheader").addClass("white-bg");
        } else {
            $(".mz-homepageheader,.mz-pageheader").removeClass("white-bg");
        }
    });
    }
	

	/*$('.show_hide').click(function() {
        $(".slidingDiv").slideToggle();
        $(".slidingDiv").removeClass('hidden');
	});*/
	
	$(".show_hide").click(function(e) {
        $(".slidingDiv").slideToggle();
        $(".slidingDiv").removeClass('hidden');
        e.stopPropagation();
    });

    $(".show_hide").click(function(e) {
        e.stopPropagation();
        $(".slidingDiv").removeClass('hidden');
    });

    $(document).click(function() {
        $(".slidingDiv").slideUp();
    });
	
    /*header and page content not([class='bx-clone'])*/
    var headerHeight = $(".mz-header-wrapper").height();
    $('.content-top-margin').css("margin-top", headerHeight);
    $(window).resize(function(){
        var headerHeight = $(".mz-header-wrapper").height();
        $('.content-top-margin').css("margin-top", headerHeight);
    });
    $(window).resize();
    
    $(document).ready(function () {
        
         function imgDataSrcLoad() {
            var imgDefer = document.getElementsByTagName('img');
            for (var i=0; i<imgDefer.length; i++) {
                if(imgDefer[i].getAttribute('data-src')) {
                    imgDefer[i].setAttribute('src',imgDefer[i].getAttribute('data-src'));
                } 
            } 
        }
        imgDataSrcLoad();
        
        
        var softCartModel = new CartModels.Cart();
        softCartModel.apiGet().then(function() {
            CartMonitor.setCount(softCartModel.count());
            
            if (softCartModel.count() === 0) 
                {
                    $('.mybag-icon').hide();
                }
                else
                    $('.mybag-icon').show();
        });
        $(document).on('cartChanged',function(e,softcartModelobj){
            if (softcartModelobj.count() === 0) 
                {
                    $('.mybag-icon').hide();
                }
                else
                    $('.mybag-icon').show();
        });
    });
    
});

