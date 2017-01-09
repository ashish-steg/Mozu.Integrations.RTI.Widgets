require(["modules/jquery-mozu", "hyprlive", "modules/backbone-mozu"], function ($, Hypr, Backbone) {
  $(document).ready(function () {
        var ulHeight = $('#mysticnav').find('.mobile-menu-ul').outerHeight();
        var abc;
        $("#mobile-menu-icon").on("click",function(){
        if($(".mz-menuicon").hasClass("open")){
            $(".mz-menuicon").removeClass("open");
            $(".mobile-container-main").removeClass('active1');
            $('.mask').fadeOut();
            $('#page-wrapper').removeClass('menuOpen');
            $('#mysticnav').find('.slideright').css('height', '0px');
        
            } else {
                $(".mz-menuicon").addClass("open");
                $(".mobile-container-main").addClass('active1');
                $('.mask').fadeIn();
                $('#page-wrapper').addClass('menuOpen');
                $('.slideright').height(ulHeight);
            }
        });
        $(".mask").on("click",function(){
            $("#page-wrapper").find('.mz-menuicon').removeClass("open");
            $("body").find('.mobile-container-main').removeClass("active1");
            $('.mask').fadeOut();
            $('#page-wrapper').removeClass('menuOpen');
            $('#mysticnav').find('.slideright').removeClass('active3').css('height', '0px').removeClass('transition');
            $('#mysticnav').find('.mob-sub-menu-container').removeClass('active2');
            $('#mysticnav').find('.mz-sitenav-item').css('display', 'block');
            
        });
        
        $(".mymenuli").on("click",function(){
            $(this).parent('.mz-sitenav-item').find('.mob-sub-menu-container').addClass('active2');
            abc = $(this).parent('li').find('.mob-sub-menu-container').outerHeight();
            $('.slideright').height(abc);
            if($(this).parent('.mz-sitenav-item').children('ul').hasClass('mob-sub-menu-container')) {
                $(this).parent('.mz-sitenav-item').addClass('active3');
                $('.slideright').removeClass('active4').addClass('active3').addClass('transition');
                $('#mysticnav .mz-sitenav-item').each(function() {
                if($(this).hasClass('active3')) {
                    $(this).css('display', 'block');
                } else {
                    $(this).css('display', 'none');
                }
            });
            } else {
                $('.slideright').removeClass('active3').addClass('active4');
            }
        });
        $(".mz-sitenav-subitem .menuTitle").on("click",function(){
            $(this).closest('.mz-sitenav-subitem').next('.sub-sub-item').addClass('active4');
            var xyz = $(this).closest('.mz-sitenav-subitem').next('.sub-sub-item').outerHeight();
            $('.slideright').height(xyz);
            $('.mob-sub-menu-container').removeClass('active2').addClass('active3');
            $('.subBackArrow').on("click",function(e){
                e.preventDefault();
                $(this).closest('.mz-sitenav-subitem').next('.sub-sub-item').removeClass('active4');
                $('.mob-sub-menu-container').removeClass('active3').addClass('active2');
                $('.slideright').height(abc);
            });
        });
        $('.backArrow').on("click",function(e){
            e.preventDefault();
            $('#mysticnav').find('.mob-sub-menu-container').removeClass('active2');
            $('#mysticnav').find(".mobile-container-main").addClass('active1');
            $('.slideright').removeClass('active3').addClass('active1');
            $(this).parent().parent('.mz-sitenav-item').removeClass('active3');
            $('#mysticnav').find('.mz-sitenav-item').css('display', 'block');
            $('.slideright').height(ulHeight);
        });
    });
});
