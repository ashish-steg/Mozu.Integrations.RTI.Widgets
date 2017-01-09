require([
    'modules/jquery-mozu', 
    'underscore',
    'modules/api', 
    'modules/backbone-mozu',
    'modules/models-product', 
    'modules/models-cart', 
    'modules/cart-monitor',
    'shim!vendor/jquery/owl.carousel.min',
    'bootstrap'
], 
function($, _, api,Backbone, ProductModels, CartModels, CartMonitort) {
    
	/*Recommended Product Code Starts*/
	var pageContext = require.mozuData('pagecontext');
	var eFlag = 0;
	var ProductModelColor = Backbone.MozuModel.extend({
        mozuType: 'products'
    });
    var ProductListView = Backbone.MozuView.extend({
        templateName: 'modules/product/related-product-tiles',
        additionalEvents: {
            "click .next": "next",
            "click .previous": "previous",
            "click [data-mz-swatch]" : "colorSwatchingRecommend",
            "click a.wishlist-button": "addToWishlist",
            "touchstart a.wishlist-button": "addToWishlist"
        },
        initialize: function() {
            this.owl = null;
            var self = this;
            var isUserAnonymous = require.mozuData('user').isAnonymous;
            if (isUserAnonymous === false) {
                self.addedToWishlist(); 
            }
        },
        render: function() {
            var self = this;
            var owlItems = 1;
                if(pageContext.isDesktop) {
                    owlItems = 6;
                } 
                else if(pageContext.isTablet) {
                    owlItems = 3;
                } 
                else {
                    owlItems = 1;
                }
                Backbone.MozuView.prototype.render.apply(this, arguments); 
                this.colorSwatchingRecommend();
                this.priceFunction();
                var catTitle = '';
                $('[data-toolstip="toolstip"]').tooltip();
            
                var owl =  $(".ig-recommended-products #owl-example").owlCarousel({ 
                    loop: false,
                    responsiveClass:true,
                    responsive:{
                        0 : {
                            items: 2,
                            nav:false
                        },
                        480 : {
                            items:3,
                            nav:false
                        },
                        1025 : {
                            items:6,
                            nav:false
                        }
                    }
                });
                owl.on('changed.owl.carousel', function(e) {
                    if( e.item.index >= 1) 
                        $(".ig-recommended-products").find('.previous').show();
                    else
                        $(".ig-recommended-products").find('.previous').hide();
                    if( e.item.index === e.item.count-owlItems) 
                        $(".ig-recommended-products").find('.next').hide();
                    else 
                        $(".ig-recommended-products").find('.next').show();
                });
                
                if(owl.find('.owl-item').length <= owlItems)
                    $(".ig-recommended-products").find('.next').hide();
                
                $(".ig-recommended-products #owl-example > .owl-item").addClass("mz-productlist-item");
                $('.ig-recommended-products .next').on('click', function() {
                    owl.trigger('next.owl.carousel');
                });
                $('.ig-recommended-products .previous').on('click', function() {
                    owl.trigger('prev.owl.carousel');
                });
                
                var owlItemTotal3 = $(".ig-recommended-products .owl-item").length;
                if(pageContext.isDesktop && owlItemTotal3 >= 6 ) {
                  $(".ig-recommended-products").css("border-right", "none");
                }
                if(pageContext.isTablet && owlItemTotal3 >= 3 ) {
                  $(".ig-recommended-products").css("border-right", "none");
                }
                if(pageContext.isMobile && owlItemTotal3 >= 2 ) {
                  $(".ig-recommended-products").css("border-right", "none");
                } 
                //this.colorSelected();
                this.manageBlocksHeight();
            },
        
        colorSwatchingRecommend: function(e) {
            $('[data-mz-swatch]').on("click", function(e){
               e.preventDefault();
                if (eFlag === 0) {
                    eFlag = 1;
                    var $currentEvtSource = $(e.currentTarget);
                    //$currentEvtSource.closest('.ig-related-products').find('input').css({'border': 'none'});
                    $currentEvtSource.closest('.owl-item').find('input').css({'border': 'none'});
                    $currentEvtSource.css({'border': '2px solid #4a4a4a'});
                    var productCode = $currentEvtSource.closest('.mz-productlisting').data('mz-product');
                    
                    var swatchCol = $currentEvtSource.attr('value').toLowerCase();
                    var swatchColor = $currentEvtSource.attr('value');
                    
                    var mainImage = $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr("data-main-image-src");
                    
                    var url = window.location.origin;
                    $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').removeClass('active');
                    $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').addClass('active');
                    var CurrentProductModel = new ProductModelColor();
                    CurrentProductModel.set('filter', 'productCode eq '+productCode);
                           
                    CurrentProductModel.fetch().then(function(responseObject) {
                        var prodContent = responseObject.apiModel.data.items;
                        var prodImg = null, prodImgAltText = null, ImgAltText = null;
                        var flag = 0;
                        
                        _.each(prodContent, function(productImages) {
                            prodImg = _.findWhere(productImages.content.productImages, {altText: swatchColor || swatchCol});
                        });
                        if (prodImg) {
                            var prodImage = prodImg.imageUrl;
                            $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({"srcset": prodImage+"?max=400", "alt": ImgAltText, "style":""}).addClass('active');
                            $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                            eFlag = 0;
                        } else {
                            $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({"srcset": mainImage+"?max=400", "style":""}).addClass('active');
                            $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                            eFlag = 0;
                        }
                    });
                }
            });
        },
        addToWishlist: function(e) {
            e.preventDefault();
            var qvProductCode = $(e.currentTarget).data("listing-prod-code");
            var currentWishListBtn = e.currentTarget;
            
            if($(currentWishListBtn).hasClass('addedToWishlist')) {
                
            } else {
                $(currentWishListBtn).addClass('clicked');
            }
    
            var newPromise = api.createSync('wishlist').getOrCreate(require.mozuData('user').accountId).then(function(wishlist) {
                return wishlist.data;
            }).then(function(wishlistItems) {
                var proceed = true;
                for (var i = 0; i < wishlistItems.items.length; i++) {
                    if (wishlistItems.items[i].product.productCode == qvProductCode) {
                        proceed = false;
                    }
                }
    
                if (proceed) {
                    var product = new ProductModels.Product({ productCode: qvProductCode} );
                    product.addToWishlist({ quantity: 1});
    
                    try {
                        product.on('addedtowishlist', function(wishlistitem) {
                            $(currentWishListBtn).attr('disabled', 'disabled');
                            $(currentWishListBtn).addClass("addedToWishlist");
                        });
                    } catch (err) {
                        console.log("Error Obj:" + err);
                    }
                }
            });
        },
        
        addedToWishlist: function () {

            var productCodesShown = [];
            var productsWishlistBtns = [];
            var productCodesShownIndex = 0;
            
            $('.owl-item').each(function() {
                var wishlistBtn = $(this).find("a.wishlist-button");
                var listingProductCode = $(wishlistBtn).data("listing-prod-code");
                productCodesShown[productCodesShownIndex] = listingProductCode;
                productsWishlistBtns[productCodesShownIndex] = wishlistBtn;
                productCodesShownIndex++;
            });
            var isUserAnonymous = require.mozuData('user').isAnonymous;
            if (isUserAnonymous === false) {
                var newPromise = api.createSync('wishlist').getOrCreate(require.mozuData('user').accountId).then(function(wishlist) {
                    return wishlist.data;
                }).then(function(wishlistItems) {
                    for (var j = 0; j < productCodesShown.length; j++) {
                        for (var i = 0; i < wishlistItems.items.length; i++) {
                            if (wishlistItems.items[i].product.productCode == productCodesShown[j]) {
                                $(productsWishlistBtns[j]).prop('disabled', 'disabled');
                                $(productsWishlistBtns[j]).addClass("addedToWishlist");
                            }
                        }
                    }
                });
            }
        },
    
        getMaxHeight: function(selector) { 
            return Math.max.apply(null, $("" + selector).map(function ()
            {
                return $(this).height();
            }).get());
        },
        manageBlocksHeight: function() {
            try {
                var self = this;
            } catch (err) {
                /*ignore*/
            }
        },
        /*moveTitle: function(catTitle) { 
            $('.recommended-product-container .slider-title').text(Hypr.getLabel('topSelling') + ' ' + catTitle);
            $('.recommended-product-container .slider-title').removeClass('hidden');
        },*/
        priceFunction: function() {
            $('.mz-price').each(function() {
                var amountText = $(this).data("total-amount");
                var amountString = amountText.toString();
                var amountDollar = amountString.charAt(0);
                var totalp = amountString.split(amountDollar);
                var decimal = totalp[1].split('.');
                var afterDecimal = decimal[1];
                if(afterDecimal == '00') {
                    $(this).html('<span class="dollar">'+amountDollar+'</span>'+decimal[0]);
                } else {
                    $(this).html('<span class="dollar">'+amountDollar+'</span>'+'<span class="interger">'+decimal[0]+'</span>'+'<sup>'+decimal[1]+'</sup>');
                }
            });
        }
    });
    var getRecommendedProducts = function() {
        var filterStr = "", retval = '';
        if( $.cookie('customerSegment') !== null && $.cookie('customerSegment') !== undefined && $.cookie('customerSegment') !== '') {
            filterStr = 'tenant~isrecommended eq "' + $.cookie('customerSegment') + '"';
            retval = api.get("search", { filter: filterStr , startIndex: 0, pageSize: 10, sortBy: 'tenant~rating desc' });
        }
        return retval;
    };

    var renderSlider = function(productsFound) {
        var prodColl = new ProductModels.ProductCollection();
        prodColl.set('items', productsFound.data.items);
        if(productsFound.data.items.length !== 0) {
            /*$('.recommended-product-container .slider-title').hide();
            $('.recommended-product-container .ig-recommended-products.carousel-parent').hide();*/
            $('#mz-drop-zone-recommended-products-container').removeClass('hidden');
        }
        var productListView = new ProductListView({
            el: $('[data-ig-recommended-products]'),
            model: prodColl
        });
        productListView.render();
    };
    try {
        getRecommendedProducts().then(function(productsFound) {
            renderSlider(productsFound);
        }, function() {
            var productsFound = {};
            productsFound.data = {};
            productsFound.data.items = [];
            renderSlider(productsFound);
        });
    } catch(err) {}
    /*Recommended Product Code Ends*/
	
});