require(['modules/jquery-mozu', 'hyprlive', 'underscore', "modules/models-product", "modules/views-productimages"],
    function ($, Hypr, _, ProductModels, ProductImageViews) {

  var ProductSlideView = window.Backbone.MozuView.extend({
        templateName: 'modules/product/product-images',
        initialize: function() {
            
        },
        render: function() {
            var me = this;
            window.Backbone.MozuView.prototype.render.apply(this, arguments);
            this.sliderFunction(); 
        },
        sliderFunction: function() {
            var self = this;
            // EDIT - Sudhir Dhumal
            var imagesParentSelector = '.mz-productimages';
            var loaded = 0;
            var numImages = $(imagesParentSelector + " img").length;
            
            $(imagesParentSelector + ' img').load(function() {
                ++loaded;
                if (loaded === numImages) {
                    
                    var maxHeight = 0;
                    _.each($(imagesParentSelector + ' img'), function(selector) {
                        if( $(selector).height() > maxHeight ) {
                            maxHeight = $(selector).height();
                            
                            $('.product-video').css('height', maxHeight + "px");
                        }
                    });
                    
                }
            });
            var owl =  $("#pdp-owl").owlCarousel({
                loop: true, 
                items: 1, 
                dots: true, 
                lazyLoad: true,
                video: true
            });
            
            var swatchOwl = $('#swatch-owl').owlCarousel({
                loop: true, 
                items: 1, 
                dots: true, 
                lazyLoad: true
            });
            
            $('.prod-next').on('click', function() {
                owl.trigger('next.owl.carousel');
                swatchOwl.trigger('next.owl.carousel');
            });
            $('.prod-previous').on('click', function() {
                owl.trigger('prev.owl.carousel');
                swatchOwl.trigger('prev.owl.carousel');
            });
            var me = this;
            var player = null;
            owl.on('play.owl.video', function(e) {
                _.defer(function(){
                    if($(".owl-item,.active").hasClass("owl-video-playing")){
                        $("iframe").attr("id","videoID");
                         var videoURL = $('#videoID').prop('src');
                         videoURL += "&enablejsapi=1&showinfo=0&controls=0&loop=1&iv_load_policy=3";
                         $("#videoID")[0].src = videoURL;
                        player = new window.YT.Player('videoID', { 
                        events: {
                            'onReady': onMyPlayerReady 
                            }
                        });
                        
                    }
                    
                });
            });
            function onMyPlayerReady(event) { 
                player.mute(); 
            }
        }
    });
        
        $(document).ready(function () {
          var pageContext = require.mozuData('pagecontext');

         $.get('http://i1.adis.ws/s/mozu/' + pageContext.productCode + '.json', function(data){

         }).fail(function() {
            $('#amplience-container').hide();
        });
          var playerLayout = {
            appendTo:$("#amplience-container"),
            thumbLocation:"left",
            numThumbs:4,
            enableFullscreenMode:false
          };

          var video = { 
            autoplay:true,
            loopVideo:true
          };

          var spin = {
            autoplay:true,
            momentum:true
          };

          var zoom = {
            zoomType:"inner",
            zoomActivation:"click"
          };

          var transformations = {
            main: "$tt_poi$",
            thumb: "$thumb_desktop$"
            //zoom: "$zoom$"
          };

          var accountConfig = {
            client: "mozu",
            imageBasePath: "//i1.adis.ws/",
            contentBasePath: "//c1.adis.ws/"
          };


        var product = ProductModels.Product.fromCurrent();
        
        if(product.attributes.properties.length === 1 && product.attributes.properties[0].attributeDetail.name === "video-url")
            $('#specification-title').hide();
        
 
        var productSlideView =  new ProductSlideView({
            el: $('[data-ig-images-view]'),
            model: product
        });
        
        window.productSlideView = productSlideView;
        

         var viewer = new window.amp.StandardViewerPdp("#amplience-container", accountConfig, playerLayout, video, spin, zoom, transformations);
        });
    });

