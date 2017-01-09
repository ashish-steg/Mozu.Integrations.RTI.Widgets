/*jshint undef: true */
/*global YT */
require([
    "modules/jquery-mozu", 
    "underscore", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/cart-monitor", 
    "modules/models-product",
    'modules/models-cart',
    "modules/soft-cart",
    "modules/my-wishlist",
    'modules/api',
    'modules/models-location',
    "modules/views-productimages",
    "widgets/catalog/recent-history",
    "modules/jquery-dateinput-localized",
    'shim!vendor/jquery/owl.carousel.min[jQuery=jquery]',
    'bootstrap',
    '//www.youtube.com/iframe_api',
    'pages/location'
    ], 
    function ($, _, Hypr, Backbone, CartMonitor, ProductModels, CartModels, SoftCart, WishList, api,LocationModels, ProductImageViews, productHistoryInstance, Location) {
    var swatchImages = [];
    var wishlistSavedItems;
    var SwatchImageModel = Backbone.Model.extend({
        swatchImages : []
    });
    var productCodesVisited = {
        productCodes : []
    }; 
    var ProductModel = Backbone.MozuModel.extend({
        mozuType: 'search'
    });
    var productCodeStr = "";
    var renderImages = true;
    var swatchImageModel = new SwatchImageModel();
    
    var LocationsSearchView = Backbone.MozuView.extend({
        templateName: 'modules/location/find-in-store',
        initialize: function () {
            var self = this;
            if (window.navigator.geolocation) {
                window.navigator.geolocation.getCurrentPosition(function (pos) {
                    delete self.positionError;
                    self.populate(pos);
                }, function (err) {
                    if (err.code !== err.PERMISSION_DENIED) {
                        self.positionError = Hypr.getLabel('positionError'); 
                    }
                    self.populate();
                }, {
                    timeout: 10000
                });
            } else {
                this.populate();
            }
        },
        clickClose: function(e) {
            if ($('.iphone-screen .modal-body').hasClass('open')) {
                $('.iphone-screen .modal-body').removeClass('open');
            }  
        },
        getRenderContext: function () {
                var c = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
                c.productCode = this.product.get('productCode');
                c.productName = this.product.get('content').get('productName');
                c.productUrl = this.product.get('url');
                c.productPrice = this.product.get('price').get('price');
                c.userAdd = $("#user-addr-field").val();
                c.userDistance = $("#user-filter-distance").val();
                c.model.items = this.storeArray;
                //c.productImage = this.product.get('mainImage').get('src');
                
                return c;
        },
        populate: function (location) {
            var self = this;
            $(".spinner").show();
            this.model.apiGetForProduct({
                productCode: this.product.get('variationProductCode') || this.product.get('productCode'),
                location: location
            }).then(function () {
                
                //Now filter by distance
                var retStores = self.model.apiModel.data.items;
                var selectedStoreArray = [];
                if(!self.userDistance) {
                    self.userDistance = 10000; //default so all are covered
                }
                if(self.userDistance) {
                    for(var j = 0; j < retStores.length; j++) {
                        var store = retStores[j];
                        if(parseFloat(store.distance) <= parseFloat(self.userDistance)){
                            selectedStoreArray.push(store);
                        }
                    }
                    self.storeArray = selectedStoreArray;
                }
                self.render();
                $(".spinner").hide();
                $('.mz-locationsearch-pleasewait').fadeOut();
                self.$el.noFlickerFadeIn();
                
            });
        },
        addToCartForPickup: function (e) {
            var self = this,
                $target = $(e.currentTarget),
                loc = $target.data('mzLocation');
            $target.parent().addClass('is-loading');
            this.product.addToCartForPickup(loc);
        },
        setProduct: function (product) {
            var me = this;
            me.product = product;
            this.listenTo(me.product, 'addedtocart', function (cartitem) {
                 ///CartMonitor.addToCount(cartitem.data.quantity);//aaaa
                 CartMonitor.$el = $('[data-mz-role="cartmonitor"]');
                  CartMonitor.update();
                if (cartitem && cartitem.prop('id')) {
                    SoftCart.update().then(SoftCart.show).then(function() {
                        SoftCart.highlightItem(cartitem.prop('id'));
                        $('.soft-cart-wrap').addClass('is-active');
                    });
                    product.isLoading(false);
                } else {
                    product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
                }
            });
        },
        filterByUserLocation: function() {
            var me = this;
            var userLocation = $("#user-addr-field").val();
            me.userLocation = userLocation;
            var userDistance = $("#user-filter-distance").val();
            me.userDistance = userDistance;
            
            $.get("https://maps.googleapis.com/maps/api/geocode/json?address=" + userLocation, function(data) {
                if(data.status === "ZERO_RESULTS") {
                    $("#user-addr-field").css("border","2px solid red");
                    me.render();
                } else {
                    var locationVal = {};
                    locationVal.coords = {};
                    locationVal.coords.latitude = data.results[0].geometry.location.lat;
                    locationVal.coords.longitude = data.results[0].geometry.location.lng;
                    // lat = data.results[0].geometry.location.lat;
                    // long = data.results[0].geometry.location.lng;
                    
                    if(locationVal.coords.latitude === undefined || locationVal.coords.longitude === undefined){
                        
                    } else {
                        me.populate(locationVal);
                    }
                }  
            });
            
        }
    });
    
    var ProductSlideView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-images',
        initialize: function() {
            
        },
        render: function() {
            var me = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);
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
                        player = new YT.Player('videoID', { 
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
    var view = null;
    var ProductView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-detail',
        autoUpdate: ['quantity'],
        additionalEvents: {
            "change [data-mz-product-option]": "onOptionChange",
            "blur [data-mz-product-option]": "onOptionChange",
            "click [data-mz-product-cust-option]": "onCustOptionChange",
            "mouseover [data-mz-swatch]": "titleToolTip",
            "touchstart [data-mz-swatch]": "titleToolTip",
            "mouseover [data-toggle='tooltip']": "titleToolTip",
            "touchstart [data-toggle='tooltip']": "titleToolTip"
        },
        getRenderContext: function () {
            var renderContext = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments),
                optionValue = '',
                productImages = this.model.get('content').get('productImages'),
                options = this.model.get('options').models;
                
            var self = this;
            _.each(options, function(option, index) {
                if(option.attributes.attributeFQN.toLowerCase() && 'tenant~color' === option.attributes.attributeFQN.toLowerCase() ) {
                    optionValue = option.attributes.value;
                    _.each(productImages, function(productImage, i) {
                        if(productImage.altText === optionValue) {
                            swatchImages.push(productImage);
                        }
                    });
                    swatchImageModel.clear();
                    self.model.set('swatchImages', _.clone(swatchImages), { silent: true } );
                    swatchImageModel.set( _.clone(self.model).toJSON(), {silent: true} );
                    swatchImages = [];
                    window.productSlideView.render();
                }
            });
            
            return renderContext;
        },
        titleToolTip: function() {
            this.$el.find('[data-toggle="tooltip"]').tooltip();
        },
        priceFunction: function() {
            $('.mz-price').each(function() {
                var amountText = $(this).data("total-amount");
                var amountString = amountText.toString();
                var amountDollar = amountString.charAt(0);
                var totalp = amountString.split(amountDollar);
                var decimal = totalp[1].split('.');
                var afterDecimal = decimal[1];
                if (afterDecimal == '00') {
                    $(this).html('<span class="dollar">' + amountDollar + '</span>' + decimal[0]);
                } else {
                    $(this).html('<span class="dollar">' + amountDollar + '</span>' + '<span class="interger">' + decimal[0] + '</span>' + '<sup>' + decimal[1] + '</sup>');
                }
            });
        },
        render: function () {
            var me = this;
            
            Backbone.MozuView.prototype.render.apply(this, arguments);
            
            this.$('[data-mz-is-datepicker]').each(function (ix, dp) {
                $(dp).dateinput().css('color', Hypr.getThemeSetting('textColor')).on('change  blur', _.bind(me.onOptionChange, me));
            });
            productCodeStr = this.model.get("productCode");
            this.priceFunction();
            this.showRating();
            this.showWishlistIcon();
            this.setSelectedOption();
            this.soldOut();
            this.soldOutColor();
            this.showproductValue();
            this.soldOutSizeColor();
            this.backOrder();
        },
        showproductValue: function(){
            
            var CurrentProductModel = new ProductModel(); 
            var newArray = [];
              if(!$.cookie("visitedProducts")) {
                    productCodesVisited.productCodes.push(this.model.get('productCode'));
                    if(productCodesVisited.productCodes.length < 10){
                        $.cookie("visitedProducts", JSON.stringify(productCodesVisited), {expires: 5, path : '/'});
                    }
                    if( $('.ig-recent-history').find('.owl-item').length === 0){
                        $('#recent-history-main-content').addClass("hidden");
                    }
                }    
                else {
                    var visitedProducts = JSON.parse($.cookie("visitedProducts"));
                        visitedProducts.productCodes.push(this.model.get('productCode'));
                        $.cookie("visitedProducts", JSON.stringify(visitedProducts), {expires: 5, path : '/'});
                    var prodString = visitedProducts.productCodes;
                    var catstring = [];
                    $.each(prodString, function(index, prodIDSingle ) {
                        if(prodIDSingle !==  productCodeStr){
                            var stringCat = " or productCode eq " + prodIDSingle;
                            catstring.push(stringCat);
                        }
                        
                    });
                    var categoryIDFilterString = catstring.toString().replace(/,/g, '');
                    if(categoryIDFilterString !== "" && categoryIDFilterString !== null && categoryIDFilterString !== undefined) {
                        CurrentProductModel.set('filter', categoryIDFilterString.substr(4));
                        CurrentProductModel.fetch().then(function(responseObject) {
                            //console.log(responseObject);
                            var prodContent = responseObject.apiModel.data.items;
                            var productLength = prodContent.length;
                            var recentProductsCollection = null; 
                            _.each(prodString, function( key1, value) {
                                _.each(prodContent, function( key2, value) {
                                    if(key1 === key2.productCode){
                                        newArray.push(key2);
                                    }
                                });
                            });
                            var newProductList = newArray.reverse();
                            responseObject.apiModel.data.items = newProductList;
                            recentProductsCollection = new ProductModels.ProductCollection(responseObject.apiModel.data);
                            
                            var recentProductsView = new productHistoryInstance.recentHistroryView({
                                model: recentProductsCollection,
                                el: $('[data-ig-recent-history]')
                            });
                             recentProductsView.render();
                        
                            //recentProductsView.owlSLider();
                        });
                    }
                } 
            
        },
        showRating: function(e) {
            var me = this;
            var properties = this.model.get('properties');
            _.each(properties, function(property, index) {
                if(property.attributeFQN === "tenant~rating") {
                    _.each(property.values, function(popIndex, i) {
                        if(popIndex.value === 0)
                            $('.Star-Ratings-0').removeClass('hidden');
                        if(popIndex.value === 0.5)
                            $('.Star-Ratings-0-5').removeClass('hidden');
                        if(popIndex.value === 1)
                            $('.Star-Ratings-1').removeClass('hidden');
                        if(popIndex.value === 1.5)
                            $('.Star-Ratings-1-5').removeClass('hidden');
                        if(popIndex.value === 2)
                            $('.Star-Ratings-2').removeClass('hidden');
                        if(popIndex.value === 2.5)
                            $('.Star-Ratings-2-5').removeClass('hidden');
                        if(popIndex.value === 3)
                            $('.Star-Ratings-3').removeClass('hidden');
                        if(popIndex.value === 3.5)
                            $('.Star-Ratings-3-5').removeClass('hidden');
                        if(popIndex.value === 4)
                            $('.Star-Ratings-4').removeClass('hidden');  
                        if(popIndex.value === 4.5)
                            $('.Star-Ratings-4-5').removeClass('hidden');
                        if(popIndex.value === 5)
                            $('.Star-Ratings-5').removeClass('hidden');    
                    });
                }
            });
        },
        showWishlistIcon: function(e) {
            var me = this;
            var user = require.mozuData('user');
            var isPurchasableState = this.model.get('purchasableState');  
            var test = this.model.get('variationProductCode');
            var notDoneConfiguringState = this.model.get('notDoneConfiguring');
            var inventoryInfoObj = this.model.get('inventoryInfo');
            if(!user.isAnonymous) {
                api.createSync('wishlist').getOrCreate(user.accountId).then(function(list) {
                    var varProductCode = list.data.items;
                    console.log(varProductCode);
                    $('.wishlist-button-container #add-to-wishlist').removeClass("addedToWishlist");
                    _.each(varProductCode, function (key1, value) {
                        if (test !== undefined && test !== null && key1.product.variationProductCode !== null && key1.product.variationProductCode !== undefined && test === key1.product.variationProductCode) {
                            $('.wishlist-button-container #add-to-wishlist').addClass("addedToWishlist");
                        }
                    });
                });
                $('.wishlist-button-container').removeClass('hidden');
                $("[data-listing-prod-code]").attr('data-listing-prod-code', this.model.get('productCode'));
                if(isPurchasableState.isPurchasable && notDoneConfiguringState) {
                    $('.wishlist-button').addClass('hidden');
                }
                else if(inventoryInfoObj.outOfStockBehavior === 'HideProduct' && !inventoryInfoObj.onlineStockAvailable) {
                    $('.wishlist-button').addClass('hidden');
                }
            }
        },
        soldOut: function() { 
            var colorValue;
            var variations = this.model.get('variations');
            $('.color-swatch.color li').each(function() {
                if($(this).hasClass('selected')) {
                    colorValue = $(this).attr('value');
                    _.each(variations, function(inventory, index) {
                         _.each(inventory.options, function(color1, index) {
                            if(color1.attributeFQN.toLowerCase() === 'tenant~color') {
                                if(color1.value === colorValue) {
                                    if(inventory.inventoryInfo.manageStock === true) {
                                        if(inventory.inventoryInfo.onlineStockAvailable === 0 || inventory.inventoryInfo.onlineSoftStockAvailable === 0) {
                                            var code = inventory.productCode;
                                            _.each(inventory.options, function(size, index) {
                                                if(size.attributeFQN.toLowerCase() === 'tenant~size') {
                                                    var sizeValue = size.value;
                                                    $('.color-swatch.size .size-chart-btn').each(function() {
                                                        if(sizeValue === $(this).attr('value')) {
                                                            $(this).closest('.sizeSwatch').find('.stripeImg').css('display', 'block'); 
                                                            $(this).parent('.sizeSwatch').addClass('red-tooltip').attr('title', 'Sold Out!');
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        });
                    });
                }
            });
            $('.stripeImg').find('#mask').find('rect').attr("style", "fill:url(#stripe);");
        },
        soldOutColor: function() {
            var colorValue1;
            var ssize = 0;
            var sizeVal= [];
            var ssize2 = 0;
            var ccolor = 0;
            var variations = this.model.get('variations');
            $('.color-swatch.color li').each(function(index1) {
                ssize = 0;
                ssize2 = 0;
                colorValue1 = $(this).attr('value');
                _.each(variations, function(inventory, index) {
                     _.each(inventory.options, function(color1, index) {
                        if(color1.attributeFQN.toLowerCase() === 'tenant~color') {
                            if(color1.value === colorValue1) {
                                if(inventory.inventoryInfo.manageStock === true) {
                                    var code = inventory.productCode;
                                    _.each(inventory.options, function(size, index) {
                                        if(size.attributeFQN.toLowerCase() === 'tenant~size') {
                                            var sizeValue = size.value;
                                            ssize = ssize + 1;
                                            sizeVal[index1] = ssize;
                                            if(inventory.inventoryInfo.onlineStockAvailable === 0 || inventory.inventoryInfo.onlineSoftStockAvailable === 0) {
                                                ssize2 = ssize2 + 1;
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    });
                });
                if(sizeVal[index1] === ssize2) {
                    ccolor = ccolor + 1;
                    $(this).find('.stripeImg').css('display', 'block');
                    $(this).addClass('red-tooltip').attr('title', 'Sold Out!');
                    $(this).find('input').css('opacity', '0.7');
                }
            });
            if($('.color-swatch.color li').length === ccolor) {
                $('.color-swatch.size .stripeImg').show();
                $('.color-swatch.size .sizeSwatch').addClass('red-tooltip').attr('title', 'Sold Out!');
            }
        },
        soldOutSizeColor: function() {
            var sizeVal;
            var variations = this.model.get('variations');
                $('.color-swatch.size .sizeSwatch .size-chart-btn').each(function(index1) {
                if($(this).hasClass('temp-selected')) {
                    sizeVal = $(this).attr('value');
                    _.each(variations, function(inventory, index) {
                        _.each(inventory.options, function(size1, index) {
                            if(size1.attributeFQN.toLowerCase() === 'tenant~size') {
                                if(size1.value === sizeVal) {
                                    if(inventory.inventoryInfo.manageStock === true) {
                                        if(inventory.inventoryInfo.onlineStockAvailable === 0 || inventory.inventoryInfo.onlineSoftStockAvailable === 0) {
                                            var code = inventory.productCode;
                                            _.each(inventory.options, function(color1, index) {
                                                if(color1.attributeFQN.toLowerCase() === 'tenant~color') {
                                                    var colorValue = color1.value;
                                                    $('.color-swatch.color .color').each(function() {
                                                        if(colorValue === $(this).attr('value')) {
                                                            $(this).closest('li').find('.stripeImg').css('display', 'block');
                                                            $(this).closest('li').find('input').css('opacity', '0.7');
                                                            $(this).closest('li').addClass('red-tooltip');
                                                            $(this).closest('li').attr('title', 'Sold Out!');
                                                        }
                                                    });
                                                }
                                            });
                                        } 
                                    }
                                }
                            }
                        });
                    });
                }
            });
        },
        backOrder: function() {
            var colorSelected = $('.color-swatch.color input.temp-selected').data('color-swatch-value');
            var sizeSelected = $('.color-swatch.size input.selected').data('mz-option-value');
            var variations = this.model.get('variations');
            var invInfo = this.model.get('inventoryInfo');
            var addCart = Hypr.getLabel('addToCart');
            var optionPick = Hypr.getLabel('pickOptions');
            var backOrderItem = Hypr.getLabel('backOrder');
            var outstock = Hypr.getLabel('outOfStock');
            
            if(colorSelected && sizeSelected) {
                _.each(variations, function(thisValue, index) {
                    for(var i = 0; i < thisValue.options.length; i++) { 
                        if(thisValue.options[i].attributeFQN.toLowerCase() ==="tenant~size" && thisValue.options[1].attributeFQN.toLowerCase() ==="tenant~color" || thisValue.options[i].attributeFQN.toLowerCase() ==="tenant~color" && thisValue.options[1].attributeFQN.toLowerCase() ==="tenant~size") {
                            if(thisValue.options[i].value == sizeSelected && thisValue.options[1].value == colorSelected || thisValue.options[i].value == colorSelected && thisValue.options[1].value == sizeSelected){
                                if(thisValue.inventoryInfo.manageStock === true && thisValue.inventoryInfo.onlineStockAvailable === 0 || thisValue.inventoryInfo.onlineSoftStockAvailable === 0) {
                                    if(thisValue.inventoryInfo.outOfStockBehavior === 'DisplayMessage') {
                                        $('#add-to-cart.mz-productdetail-addtocart-disabled').text(outstock);
                                    } else if(thisValue.inventoryInfo.outOfStockBehavior === 'AllowBackOrder') {
                                        $('#add-to-cart').text(backOrderItem).css('width', 'auto');
                                    }
                                } else {
                                    $('#add-to-cart.mz-productdetail-addtocart-disabled').text(optionPick);
                                    $('#add-to-cart').text(addCart);
                                }
                            }
                        }
                    }
                });
            } else if(colorSelected || sizeSelected) {
                _.each(variations, function(thisValue, index) {
                    for(var i = 0; i < thisValue.options.length; i++) { 
                        if(thisValue.options[i].attributeFQN.toLowerCase() ==="tenant~size" || thisValue.options[i].attributeFQN.toLowerCase() ==="tenant~color") {
                            if(thisValue.options[i].value == sizeSelected || thisValue.options[i].value == colorSelected){
                                if(thisValue.inventoryInfo.manageStock === true && thisValue.inventoryInfo.onlineStockAvailable === 0 || thisValue.inventoryInfo.onlineSoftStockAvailable === 0) {
                                    if(thisValue.inventoryInfo.outOfStockBehavior === 'DisplayMessage') {
                                        $('#add-to-cart.mz-productdetail-addtocart-disabled').text(outstock);
                                    } else if(thisValue.inventoryInfo.outOfStockBehavior === 'AllowBackOrder') {
                                        $('#add-to-cart').text(backOrderItem).css('width', 'auto');
                                    }
                                } else {
                                    $('#add-to-cart.mz-productdetail-addtocart-disabled').text(optionPick);
                                    $('#add-to-cart').text(addCart);
                                }
                            }
                        }
                    }
                });
            } else {
                    if(invInfo.manageStock === true && invInfo.onlineStockAvailable === 0 || invInfo.onlineSoftStockAvailable === 0) {
                        if(invInfo.outOfStockBehavior === 'DisplayMessage') {
                            $('#add-to-cart.mz-productdetail-addtocart-disabled').text(outstock);
                        } else if(invInfo.outOfStockBehavior === 'AllowBackOrder') {
                            $('#add-to-cart').text(backOrderItem).css('width', 'auto');
                        }
                    } else {
                        $('#add-to-cart.mz-productdetail-addtocart-disabled').text(optionPick);
                        $('#add-to-cart').text(addCart);
                    }
                }
        },
        setSelectedOption: function() {
            var me = this;
            var options = this.model.get('options').models;
            _.each(options, function(option, index) {
                var optionModel = option.attributes;
                if(optionModel.attributeFQN.toLowerCase() === 'tenant~size') {
                    _.each(optionModel.values, function(value, index) {
                        if(value.isSelected) {
                            $.each($('.color-swatch').find('.this-is-others'), function(i, $currentEl) {
                                if($($currentEl).val() === value.value) {
                                    $($currentEl).addClass('temp-selected');
                                }
                            });
                        }
                    });
                }
                else if(optionModel.attributeFQN.toLowerCase() === 'tenant~color') {
                    _.each(optionModel.values, function(value, index) {
                        if(value.isSelected) {
                            $.each($('.color-swatch').find('.color'), function(i, $currentEl) {
                                if($($currentEl).val() === value.value) {
                                    $($currentEl).addClass('temp-selected');
                                }
                            });
                        }
                    });
                }
            });
        },
        onOptionChange: function (e) {
            return this.configure($(e.currentTarget));
        },
        
        setProductColorOption: function(e) {
            var currentTarget = $(e.currentTarget);
            $.each($('.color-swatch').find('.color'), function(i, $currentEl) {
                if($($currentEl).hasClass('temp-selected'))
                    $($currentEl).removeClass('temp-selected');
            });
            $(e.currentTarget).addClass('temp-selected');
            var newValue = $(currentTarget).data("color-swatch-value"),
                oldValue,
                id = $(currentTarget).data('product-option-id'),
                isPicked = $(currentTarget).hasClass("selected") ? false : true,
                option = this.model.get('options').get(id),
                productImages = this.model.get('content').get('productImages');
                
            if (option) {
                if (option.get('attributeDetail').inputType === "YesNo") {
                    option.set("value", isPicked);
                    renderImages = true;
                } else if (isPicked) {
                    oldValue = option.get('value');
                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                        option.set('value', newValue);
                        //$(e.currentTarget).removeClass('temp-selected');
                        renderImages = true;
                    }
                }
            }
        },
        
        onCustOptionChange: function(e) {
            var currentTarget = $(e.currentTarget);
            $.each($('.color-swatch').find('.this-is-others'), function(i, $currentEl) {
                if($($currentEl).hasClass('temp-selected'))
                    $($currentEl).removeClass('temp-selected');
            });
            $(e.currentTarget).addClass('temp-selected');
            
            return this.configureCustOption($(e.currentTarget));
        },
        
        configureCustOption: function ($optionEl) {
            var newValue = $optionEl.data("mz-option-value"),
                oldValue,
                id = $optionEl.data('mz-product-cust-option'),
                optionEl = $optionEl[0],
                isPicked = $optionEl.hasClass("selected") ? false : true,
                option = this.model.get('options').get(id);
            if (option) {
                if (option.get('attributeDetail').inputType === "YesNo") {
                    option.set("value", isPicked);
                } else if (isPicked) {
                    oldValue = option.get('value');
                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                        option.set('value', newValue);
                        //$($optionEl).removeClass('temp-selected');
                    }
                }
            }
        },
        
        configure: function ($optionEl) {
            var newValue = $optionEl.val(),
                oldValue,
                id = $optionEl.data('mz-product-option'),
                optionEl = $optionEl[0],
                isPicked = (optionEl.type !== "checkbox" && optionEl.type !== "radio") || optionEl.checked,
                option = this.model.get('options').get(id);
            if (option) {
                if (option.get('attributeDetail').inputType === "YesNo") {
                    option.set("value", isPicked);
                } else if (isPicked) {
                    oldValue = option.get('value');
                    if (oldValue !== newValue && !(oldValue === undefined && newValue === '')) {
                        option.set('value', newValue);
                    }
                }
            }
        },
        addToCart: function () {
            if(!this.model.apiModel.data.purchasableState.isPurchasable) {
                $(".mz-productdetail-addtocart-disabled").css("display", "inline-block");
                $(".mz-productdetail-addtocart").hide();
                setTimeout(function (event) {
                    $(".mz-productdetail-addtocart-disabled").fadeOut(600);
                    $(".mz-productdetail-addtocart").delay(600).fadeIn(600);
                }, 2000);
            }
            else
                this.model.addToCart();
        },
        addToWishlist: function () {
            this.model.addToWishlist();
        },
        checkLocalStores: function (e) {
            $(".iphone-screen .store-show").on("click",function(){
                $('.iphone-screen .modal-body').addClass('open');
            });
            var me = this;
            e.preventDefault();
            var modalTemplate = Hypr.getTemplate('modules/location/find-in-store');
            var $findinstorePopup = $('.findinstorePopup');
            var $lightboxProduct = $('.modal-body');
            
            var product = this.model, //ProductModels.Product.fromCurrent(), 
                productPresent = !!product.get('productCode'),
                locationsCollection = new LocationModels.LocationCollection();
                
            var ViewClass = productPresent ? LocationsSearchView : Location.LocationsView;
           
            if (view !== null) {
                view.undelgateEvents();
            }
            view = new ViewClass({
                model: locationsCollection,
                el: $lightboxProduct
            });
            $(".location-search-resuls").show();

            if (productPresent) view.setProduct(product);
            window.lv = view;
            
        },
        initialize: function () {
            // handle preset selects, etc
            var me = this;
            this.$('[data-mz-product-option]').each(function () {
                var $this = $(this), isChecked, wasChecked;
                if ($this.val()) {
                    switch ($this.attr('type')) {
                        case "checkbox":
                        case "radio":
                            isChecked = $this.prop('checked');
                            wasChecked = !!$this.attr('checked');
                            if ((isChecked && !wasChecked) || (wasChecked && !isChecked)) {
                                me.configure($this);
                            }
                            break;
                        default:
                            me.configure($this);
                    }
                }
            });
        }
    });
    
    $(document).ready(function () {
         
        var product = ProductModels.Product.fromCurrent();
        
        if(product.attributes.properties.length === 1 && product.attributes.properties[0].attributeDetail.name === "video-url")
            $('#specification-title').hide();
         
        var modelToPass = null;
        
        if(swatchImageModel.swatchImages.length > 0) {
            modelToPass = swatchImageModel;
        } 
        else {
            modelToPass = product;
        }
 
        var productSlideView =  new ProductSlideView({
            el: $('[data-ig-images-view]'),
            model: modelToPass
        });
        
        window.productSlideView = productSlideView;
        window.productSlideView.render();
        $(document).on("removeFilledHeart", function() {
            productView.render();
        });
        product.on('addedtocart', function (cartitem) {
            /*$("#is-loading-container").find('span').removeClass('hidden');*/
            if (cartitem && cartitem.prop('id')) {
                product.isLoading(true);
                CartMonitor.addToCount(product.get('quantity'));
                SoftCart.update().then(SoftCart.show).then(function() {
                    /*SoftCart.highlightItem(cartitem.prop('id'));*/
                    $('.soft-cart-wrap').addClass('is-active');
                    /*$("#is-loading-container").find('span').addClass('hidden');*/
                });
                
                CartMonitor.$el = $('[data-mz-role="cartmonitor"]');
                CartMonitor.update();
                product.isLoading(false);
            } else {
                product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
                /*$("#is-loading-container").find('span').addClass('hidden');*/
            }
        });
        
        var isUserAnonymous = require.mozuData('user').isAnonymous;
        if (isUserAnonymous === false) {
            product.on('addedtowishlist', function (cartitem) {
                $(document).trigger('productAddedToWishlist');
                
                $('.wishlist-button-container #add-to-wishlist').addClass("addedToWishlist");
            });
            
            /*api.createSync('wishlist').getOrCreate(require.mozuData('user').accountId).then(function(wishlist) {
                return wishlist.data;
            }).then(function(wishlistItems) {
                for(var i = 0; i < wishlistItems.items.length; i++) { 
                    if(wishlistItems.items[i].product.productCode == product.attributes.productCode ) {
                        wishlistSavedItems = wishlistItems.items[i];
                        $('.wishlist-button-container #add-to-wishlist').prop('disabled', 'disabled');
                        $('.wishlist-button-container #add-to-wishlist').addClass("addedToWishlist");
                    }
                }
            });*/
        }
            
        var productView = new ProductView({
            el: $('#product-detail'),
            model: product,
            messagesEl: $('[data-mz-message-bar]')
        });

        window.productView = productView;
        productView.render();
    });
});