require([
    'modules/jquery-mozu',
    'hyprlive',
    "hyprlivecontext",
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'modules/models-product',
    'modules/models-cart',
    'modules/cart-monitor',
    'shim!vendor/jquery/owl.carousel.min[modules/jquery-mozu=jQuery]>jQuery'
],
function($, Hypr, HyprLiveContext, _, api,Backbone, ProductModels, CartModels, CartMonitor) {
  var mainConfig = require.mozuData('modelconfig');
  var params = mainConfig.params;
  var includeSiteId = mainConfig.includeSiteId;
  var includeTenantId = mainConfig.includeTenantId;
  var isConfigged = mainConfig.isConfigged;
  var jsInject = mainConfig.javascriptInjection;

  //CustomerId, customerCode, and pagetype are all variables used by the
  //whole page, but are right now being set by each individual display widget.
  //It's possible that the user could accidentally set the pagetype differently in
  //the each display widget. So we're going to go with the info that is in the first one
  //on the page.

  var firstDisplay = $('.recommended-product-container').first();
  var secondaryConfig = firstDisplay.data('mzRtiRecommendedProducts');
  var customerId = secondaryConfig.customerId;
  var customerCode = secondaryConfig.customerCode;
  var pageType = secondaryConfig.pageType;



  var containerList = []; //All widgets to be populated
  $('.recommended-product-container').each(function(a, b){
    var configData = $(this).data('mzRtiRecommendedProducts');
    console.log(configData);
    var container = {config: configData};
    containerList.push(container);

  });

  var pageContext = require.mozuData('pagecontext');
  var siteContext = require.mozuData('siteContext');

/*Recommended Product Code Starts*/
	  var eFlag = 0;
    var ProductModelColor = Backbone.MozuModel.extend({
        mozuType: 'products'
    });
    var ProductListView = Backbone.MozuView.extend({
        templateName: 'Widgets/RTI/rti-product-tiles',
        additionalEvents: {
            "click .next": "next",
            "click .previous": "previous",
            "click a.wishlist-button": "addToWishlist",
            "touchstart a.wishlist-button": "addToWishlist"
        },
        initialize: function() {
            // this.owl = null;
            var self = this;
            var isUserAnonymous = require.mozuData('user').isAnonymous;

            if (isUserAnonymous === false) {
                self.addedToWishlist();
            }
        },
        render: function(placeholder) {
            var self = this;
            var owlItems = 1;
                if(pageContext.isDesktop) {
                    owlItems = 4;
                }
                else if(pageContext.isTablet) {
                    owlItems = 3;
                }
                else {
                    owlItems = 2;
                }
                Backbone.MozuView.prototype.render.apply(this, arguments);
                this.colorSwatchingRecommend();
                //this.priceFunction();
                var catTitle = '';
                $('[data-toolstip="toolstip"]').tooltip();
                  var owl = $(".rti-recommended-products."+placeholder+" .related-prod-owl-carousel");
                  owl.owlCarousel({
                      loop: false,
                      responsiveClass:true,
                      responsive:{
                          0 : {
                              items: 2,
                              nav:false
                          },
                          480 : {
                              items: 3,
                              nav:false
                          },
                          1025 : {
                              items: 4,
                              nav:false
                          }
                      }
                  });

                  owl.on('changed.owl.carousel', function(e) {
                      if( e.item.index >= 1)
                          $(".rti-recommended-products."+placeholder).find('.previous').show();
                      else
                          $(".rti-recommended-products."+placeholder).find('.previous').hide();
                      if( e.item.index === e.item.count-owlItems)
                          $(".rti-recommended-products."+placeholder).find('.next').hide();
                      else
                          $(".rti-recommended-products."+placeholder).find('.next').show();
                  });

                  if(owl.find('.owl-item').length <= owlItems)
                      $(".rti-recommended-products."+placeholder).find('.next').hide();

                  $(".rti-recommended-products."+placeholder+" .related-prod-owl-carousel > .owl-item").addClass("mz-productlist-item");
                  $('.rti-recommended-products.'+placeholder+' .next').on('click', function() {
                      owl.trigger('next.owl.carousel');
                  });
                  $('.rti-recommended-products.'+placeholder+' .previous').on('click', function() {
                      owl.trigger('prev.owl.carousel');
                  });

                  var owlItemTotal3 = $(".rti-recommended-products."+placeholder+" .owl-item").length;
                  if(pageContext.isDesktop && owlItemTotal3 >= 5 ) {
                    $(".rti-recommended-products."+placeholder).css("border-right", "none");
                  }
                  if(pageContext.isTablet && owlItemTotal3 >= 3) {
                    $(".rti-recommended-products."+placeholder).css("border-right", "none");
                  }
                  if(pageContext.isMobile && owlItemTotal3 >= 2 ) {
                    $(".rti-recommended-products."+placeholder).css("border-right", "none");
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

    var buildProductUrl = function(pageType){


      var firstPart = '//' + customerId + '-' + customerCode + '.baynote.net/recs/1/' + customerId + '_' + customerCode + '?';
      var requiredParams = '&attrs=Price&attrs=ProductId&attrs=ThumbUrl&attrs=Title&attrs=url';

      var bnExtUserId = require.mozuData('user').userId;
      var userId = getCookie('bn_u');


      var userIdQuery = "&userId="+userId;
      var bnExtUserIdQuery = "&User.bnExtUserId="+bnExtUserId;

      var extrasQuery;
      //If the user has submitted params, they go here
      if (params) {
        extrasQuery = params;
      } else {
        //If not, the three are submitted blank
        extrasQuery = "&query=&Override=&Product.Override=";
      }

      var source = window.location.href;
      if (source.startsWith("http://")){
        source = "https://" + source.slice(7);
      }
      var sourceQuery = "&source="+source;

      var tenantIdQuery = "&tenantId=";
      var siteIdQuery = "&siteId=";

      if (includeTenantId){
        tenantIdQuery +=siteContext.tenantId;
      }
      if (includeSiteId){
        siteIdQuery +=siteContext.siteId;
      }

      //The queries stored in pageDependentSection vary between page types
      //Right now the only difference configured is thatif pageType is cart,
      //We add productIds to the query.

      var pageDependentSection = "";
      if (pageType=="Home"){

      } else if (pageType=="ProductDetail") {

      } else if (pageType=="Cart"){

        var cart = require.mozuData('cart');
        if (!cart.isEmpty){
          for(var i=0; i<cart.items.length; i++){
            var productId = cart.items[i].id;
            var productQuery = "&productId="+productId;
            pageDependentSection += productQuery;
          }
        }
      }

      //Finally, we're going to let the user inject here
      //Whatever javascript they need to gather their custom cookies.
      //We will expect the user to append whatever they need into
      //the variable "inject".


      var inject = "";

      if (jsInject){
        try {
          eval(jsInject); // jshint ignore:line

        } catch(e) {
          console.log("There was a problem with your javascript injection.");
          console.log(e);
        }
      }


      var url = firstPart +
       requiredParams +
        userIdQuery +
         bnExtUserIdQuery +
          extrasQuery + //From params field in config editor
           sourceQuery + //Current page URL
            pageDependentSection +
             tenantIdQuery + //From checkbox
              siteIdQuery + //From checkbox
               inject; //From javascript field in config editor



        url += "&format=json";
        return url;

    };

    var getRecommendedProducts = function(callback) {
      var url = buildProductUrl(pageType);
      return $.get(url, callback);

    };

    var productItems = new Backbone.Collection();
    var productItem = Backbone.MozuModel.extend({
        defaults: {
            data: {}
        }
    });

     var getProducts =function(rtiProductList){
        var deferred = api.defer();
        var numReqs = rtiProductList.length;
        var productList = [];
        _.each(rtiProductList, function(attrs) {
            var op = api.get('product', attrs.ProductId);
            op.then(function(data) {
                data.data.rtiRank = attrs.rank;
                productList.push(data.data);
                if (--numReqs === 0) {
                    _.defer(function() {
                        deferred.resolve(productList);
                    });
                }
            }, function(reason){
                if (--numReqs === 0) {
                    _.defer(function() {
                        deferred.resolve(productList);
                    });
                }
            });
        });

        return deferred.promise;
    };


    var renderSlider = function(data) {
        _.each(containerList, function(container){

          var placeholder = container.config.placeholder;
          var numberOfItems = container.config.numberOfItems;
          var configTitle = container.config.title;


          var widgetResults = $.grep(data.widgetResults, function(e){ return e.placeholderName == placeholder; });
          if (!widgetResults[0]){
            if (pageContext.isEditMode){
              $('.recommended-product-container.'+placeholder).text("Found no data for products to display for that placeholder.");
            }
          } else {

            var displayName;
            //if configTitle has a value, the user entered a title to
            //override the title set in RTI
            if (configTitle){
              displayName = configTitle;
            } else {
              //if configTitle has no value, we get the title from the
              //product results call
              displayName = widgetResults[0].displayName;
            }
            //widgetResults should, at this point, be an array of only 1 item
            //Prune slotResults list in widgetResults for "products" that don't contain any data.
            var productSlots = widgetResults[0].slotResults.filter(function(product){
             return product.url;
           });
            //If the pruned list contains anything, we continue.
            if (productSlots.length){
              $("."+placeholder+".slider-title").text(displayName);
              var productIdList = [];
                  _.each(productSlots, function(prod, key){
                      var attrs = [];
                      _.each(prod.attrs, function(attr, key, list){
                          attrs[attr.name] = attr.values[0];
                      });
                      attrs.rank = prod.rank;
                      productIdList.push(attrs);
                  });

                  if(productIdList.length !== 0) {
                      getProducts(productIdList).then(function(products){
                          if(products.length !== 0) {
                              var productsByRank = _.sortBy(products, 'rtiRank');
                              console.log("numberOfITems"+numberOfItems);
                              if (productsByRank.length>numberOfItems){
                                console.log("productsByRank.length>numberOfItems");
                                console.log("length before"+productsByRank.length);
                                productsByRank = productsByRank.slice(0, numberOfItems);
                                console.log("length after"+productsByRank.length);
                              }
                              var prodColl = new ProductModels.ProductCollection();
                              prodColl.set('items', productsByRank);


                               var productListView = new ProductListView({
                                  el: $('[data-rti-recommended-products='+placeholder+']'),
                                  model: prodColl
                              });
                              productListView.render(placeholder);
                              return;
                          }
                          $('.recommended-product-container .'+placeholder+'.slider-title').hide();
                          $('.recommended-product-container .rti-recommended-products.'+placeholder+'.carousel-parent').hide();
                          $('.recommended-product-container.'+placeholder).removeClass('hidden');
                      });
                  }
            } else {
              if (pageContext.isEditMode){
                $('.recommended-product-container.'+placeholder).text("An RTI recommendations widget is dropped but there are no products to display.");
              }
            }
          }
        });
    };

    var getCookie = function(cname){
      var name = cname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(name) === 0) {
              return c.substring(name.length, c.length);
          }
      }
      return "";
  };

    try {
        getRecommendedProducts(function(data) {
            renderSlider(data);
        }, function() {
            var productsFound = {};
            productsFound.data = {};
            productsFound.data.items = [];
            renderSlider(productsFound);
        });
    } catch(err) {}
    /*Recommended Product Code Ends*/

});
