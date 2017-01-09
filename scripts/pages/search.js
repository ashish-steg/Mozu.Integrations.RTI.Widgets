require(['modules/jquery-mozu',
    'underscore',
    'modules/backbone-mozu',
    'hyprlive',
    'modules/views-collections',
    'modules/models-product',
    'modules/models-cart',
    'modules/cart-monitor',
    'modules/api',
    'bootstrap',
    'shim!vendor/jquery/jquery-ui.min'
], function($, _, Backbone, Hypr, CollectionViewFactory, ProductModels, CartModels, CartMonitor, api) {
    /*Rahul- Product Grid Start*/
    var pageSize = Hypr.getThemeSetting('defaultPageSize');
    
    var eFlag = 0;

    var ProductModel = Backbone.MozuModel.extend({
        mozuType: 'search'
    });

    var ProductModelColor = Backbone.MozuModel.extend({
        mozuType: 'products'
    });
    var ProductView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-listing',

        initialize: function() {
            var self = this;
            var isUserAnonymous = require.mozuData('user').isAnonymous;
            var isAuthenticated = require.mozuData('user').isAuthenticated;
            if (isUserAnonymous === false && isAuthenticated === true) {
                self.addedToWishlist();
            }
            this.colorSelected();
            this.priceFunction();
        },
        addedToWishlist: function() {
            var productCodesShown = [];
            var productsWishlistBtns = [];
            var productCodesShownIndex = 0;
            $('.mz-productlist-item').each(function() {
                var wishlistBtn = $(this).find("a.wishlist-button");
                var listingProductCode = $(wishlistBtn).data("listing-prod-code");
                productCodesShown[productCodesShownIndex] = listingProductCode;
                productsWishlistBtns[productCodesShownIndex] = wishlistBtn;
                productCodesShownIndex++;
            });

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
        },
        colorSelected: function() {
            var self = this;
            var productList = $('.mz-productlist-item');
            $(productList).each(function() {
                var me = this,
                    mainImageAltTextArray = [],
                    productoptionsColors = [],
                    mainImgaltText;
                var altText = $(this).find("[data-main-image-src]").attr("alt");
                if (altText) {
                    mainImgaltText = altText.toString().toLowerCase();
                }
                $(this).find('[data-mz-swatch]').each(function() {
                    var colorOption = $(this).val();
                    if (colorOption) {
                        var clr = colorOption.toString().toLowerCase();
                        productoptionsColors.push(clr);
                    }
                });
                _.each(productoptionsColors, function(colors) {
                    if (mainImgaltText === colors) {
                        $(me).find('[data-mz-swatch]').each(function() {
                            var border = this;
                            if ($(this).hasClass(mainImgaltText)) {
                                $(border).css({
                                    'border': '2px solid #4a4a4a'
                                });
                            }
                        });
                    }
                });
            });
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
        render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);
            var self = this;
            var isUserAnonymous = require.mozuData('user').isAnonymous;             
            var isAuthenticated = require.mozuData('user').isAuthenticated;
            if (isUserAnonymous === false && isAuthenticated === true) {
                self.addedToWishlist();
            }
            this.colorSelected();
            this.priceFunction();
        }
    });
    var productLoad = false;
    var lowPrice = [];
    var maxPrice = null;
    var minPrice = null;
    window.priceRangeStart = null;
    window.priceRangeEnd = null;

    var ProductViewListGrid = Backbone.View.extend({
        el: 'body',
        events: {
            "click input[data-mz-swatch]": "colorSwatching",
            "click [data-mz-product-grid-view]": "productGridView",
            "click [data-mz-product-list-view]": "productListView",
            "touchstart #filter": "mobileFilter",
            "click a.wishlist-button": "addToWishlist",
            "touchstart a.wishlist-button": "addToWishlist",
            "click .scrollTop": "backToTop",
            "mouseover [data-toggle='tooltip'], [data-mz-swatch]": "titleToolTip",
            "touchstart [data-toggle='tooltip'], [data-mz-swatch]": "titleToolTip",
            "hover [data-mz-swatch], [data-toggle='tooltip']": "titleToolTip",
            "touchend [data-mz-swatch], [data-toggle='tooltip']": "titleToolTipClose"
        },
        initialize: function() {
            this.render();
            this.mobileFilter();
        },
        productGridView: function() {
            this.$el.find('.mz-productlist-item, .mz-productlisting').addClass('grid');
            this.$el.find('.mz-productlist-item, .mz-productlisting').removeClass('list');
            this.$el.find('[data-mz-product-list-view]').removeClass('active');
            this.$el.find('[data-mz-product-grid-view]').addClass('active');
            this.$el.find('[data-mz-product-grid-view]').find('#Product-Grid').children().css('fill', '#4A4A4A');
            this.$el.find('[data-mz-product-list-view]').find('#Product-Grid').children().css('fill', '#ECEDF1');
        },
        productListView: function() {
            this.$el.find('.mz-productlist-item, .mz-productlisting').addClass('list');
            this.$el.find('.mz-productlist-item, .mz-productlisting').removeClass('grid');
            this.$el.find('[data-mz-product-grid-view]').removeClass('active');
            this.$el.find('[data-mz-product-list-view]').addClass('active');
            this.$el.find('[data-mz-product-list-view]').find('#Product-Grid').children().css('fill', '#4A4A4A');
            this.$el.find('[data-mz-product-grid-view]').find('#Product-Grid').children().css('fill', '#ECEDF1');
        },
        titleToolTip: function() {
            $('[data-toggle="tooltip"]').tooltip();
        },
        titleToolTipClose: function() {
            $('[data-toggle="tooltip"]').tooltip("close");
        },
        mobileFilter: function(){
            var self = this;
            $(".filter").on("click",function(){
                $('.mz-l-sidebar').addClass('open');
                 $('.mask').css('z-index','999999');
                $('.mask').fadeIn();
            });
            $(".mask").on("click",function(){
            if ($('.mz-l-sidebar').hasClass('open')) {
                $('.mz-l-sidebar').removeClass('open');
                    $('.mask').fadeOut();
                    $('.mask').css('z-index','2999');
            }
            });
        },
        windowScroll: function() {
            var self = this;
            $(window).scroll(_.debounce(function() {
                /*back to top button */
                if ($(window || document || 'body').scrollTop() > 100) {
                    var top = self.$el.find('footer').innerHeight() + 100;
                    $('.scrollTop').fadeIn().css({
                        'bottom': "2rem",
                        'top': "initial",
                        'position': "fixed",
                        "right": "2rem"
                    });

                } else {
                    $('.scrollTop').fadeOut();
                }
                /*product loading on scroll*/
                var documentHeight = $(document).height();
                if ($(window).scrollTop() + $(window).height() >= documentHeight-20) {
                    if (productLoad === false) {
                        var liLength = $('li.mz-productlist-item').length;
                        var totalCount = $("[data-mz-total-count]").data('mz-total-count');
                        if (liLength <= totalCount) {
                            $("#more-product").addClass('active');
                            self.onScrollProductLoading();
                            productLoad = true;
                        }
                    }
                }
            }));
        },
        backToTop: function() {
            this.$el.animate({
                scrollTop: 0
            }, 800);
        },
        onScrollProductLoading: function() {
            var self = this;
            var CurrentProductModel = new ProductModel();
            var prodCode = null;
            var finalfilterValues;
            var catIDArray = [],
                catstring = [];
            var categoryId, catIdSrt, catId;
            var queryStr;
            var url = window.location.href;
            if (url.search("query=") > 0) {
                var splitStr = url.split("query=");
                var splitQ = splitStr[1].split("&");
                queryStr = splitQ[0].toString();
                CurrentProductModel.set('query', queryStr);
            }

            var catStr = url.search("ategoryId=");
            var ctStr = url.search("=categoryId%3A");
            if (catStr > 0) {
                catIdSrt = url.split("ategoryId="); /*c or C */
                catId = catIdSrt[1].split("&");
                categoryId = catId[0].toString();
                if (categoryId) {
                    catIDArray.push(categoryId);
                }
            } else if (ctStr > 0) {
                catIdSrt = url.split("categoryId%3A");
                catId = catIdSrt[1].split("&");
                categoryId = catId[0].toString();
                if (categoryId) {
                    catIDArray.push(categoryId);
                }
            }
            /*Drill down categories in facet sections*/
            $('[data-mz-facet="categoryId"]' || '[data-mz-facet="CategoryId"]').each(function() {
                var drillDownCat = $(this).data('mz-hierarchy-id');
                catIDArray.push(drillDownCat);
            });
            _.each(catIDArray, function(catIDSingle) {
                var stringCat = " or categoryId eq " + catIDSingle;
                catstring.push(stringCat);
            });

            var facetValStr = url.toLowerCase().search("enant~");
            if (facetValStr > 0) {
                var selectedFacet, facetValue, facetData, facetsApplied, facetTenent, filterStrings,
                    selectedFacetsArray = [],
                    multipleFacets = [],
                    counts = {},
                    facetselect = $('.facet-tag');
                for (var i = 0; i < facetselect.length; i++) {
                    facetData = $(facetselect[i]).find('[data-mz-facet]').data('mz-facet');
                    facetsApplied = $(facetselect[i]).find('[data-mz-selected-facet]').data("mz-selected-facet");
                    selectedFacetsArray.push(facetsApplied);
                    facetTenent = $(facetselect[i]).find('span.mz-facetingform-valuelabel').data("mz-tenent").toLowerCase();
                    multipleFacets.push(facetTenent);
                }

                var str = null;
                var max_index;
                var max_value = -1 / 0; /* Negative infinity.*/

                $.each(multipleFacets, function(i, v) {
                    if (counts[v] !== undefined) {
                        counts[v]++;
                    } else {
                        counts[v] = 1;
                    }
                });
                var strA, strB, strC, strD, strArray = [],
                    strArray1 = [],
                    filterArray = [],
                    filterArrays = [];
                $.each(counts, function(facets, count) {
                    max_value = count;
                    max_index = facets;
                    var facet = facets.split(' ').join("-");
                    var matchStr, matcheSplt, finalMatch;
                    if (count > 1) {
                        var newCount = 0;
                        /* color eq red or color eq blue or color eq green or*/
                        for (var i = 0; i < selectedFacetsArray.length; i++) {

                            matchStr = selectedFacetsArray[i].split(" eq ");
                            matcheSplt = matchStr[0].split("~");
                            finalMatch = matcheSplt[1].toLowerCase();
                            if (finalMatch === facet.toLowerCase()) {
                                ++newCount;
                                strA = selectedFacetsArray[i];
                                if (newCount == count) {
                                    strA += ') and (';
                                } else {
                                    strA += ' or ';
                                }
                                strArray.push(strA);
                            }
                        }

                        filterStrings = strArray.toString();
                        strB = filterStrings.substring(0, filterStrings.length - 7);
                        strC = ' and (' + strB + ')';
                    } else if (count === 1) {

                        for (var j = 0; j < selectedFacetsArray.length; j++) {

                            matchStr = selectedFacetsArray[j].split(" eq ");
                            matcheSplt = matchStr[0].split("~");
                            finalMatch = matcheSplt[1].toLowerCase();
                            if (finalMatch === facet && count === 1) {
                                strA = selectedFacetsArray[j];
                                strA += ' and ';
                                strArray1.push(strA);
                            }
                        }

                        var filterString = strArray1.toString().replace(/,/g, '');
                        var strE = filterString.substring(0, filterString.length - 5);
                        strD = ' and ' + strE;
                    }

                });
                filterArrays.push(strC);
                filterArray.push(strD);

                var str1 = filterArrays.toString().replace(/,/g, '');
                var str2 = filterArray.toString().replace(/,/g, '');
                var searchString;
                if (str2) {
                    searchString = str1 + str2;
                } else {
                    searchString = str1;
                }

                if (searchString) {
                    var removeFirstAnd = searchString.substr(5);
                    finalfilterValues = removeFirstAnd.toString();
                }
            }

            /*if total li is eq total count then process stop*/
            var liLength = $('li.mz-productlist-item').length;

            var pricerangeQuery;
            if (window.priceSlider === false) {
                window.priceRangeStart = $("#min-amount").text();
                window.priceRangeEnd = $("#max-amount").text();
            }
            /*property between[0,100]*/
            if (window.priceSlider === true) {
                pricerangeQuery = " and Price ge " + window.priceRangeStart + " and Price le " + window.priceRangeEnd;
                CurrentProductModel.set('startIndex', 0);
            } else {
                /*range query - if price range selected and user scroll down*/
                if (window.priceRangeStart && window.priceRangeEnd) {
                    pricerangeQuery = " and Price ge " + window.priceRangeStart + " and Price le " + window.priceRangeEnd;
                }
                CurrentProductModel.set('startIndex', liLength);
            }

            if (finalfilterValues) {
                var finalfilterValue;
                if (window.priceRangeStart && window.priceRangeEnd) {
                    finalfilterValue = finalfilterValues.toString() + pricerangeQuery.toString();
                } else {
                    finalfilterValue = finalfilterValues.toString();
                }
                window.searchStringValues = finalfilterValue.toString();
                /*CurrentProductModel.set('filterValue', 'isApplied eq true and '+finalfilterValue);*/
            } else {
                if (pricerangeQuery) {
                    window.searchStringValues = pricerangeQuery.toString().substr(5);
                }
            }

            if (catstring || pricerangeQuery) {
                var categoryIDFilterString = null;
                if (catstring.length === 1) {
                    categoryIDFilterString = catstring.toString();
                } else {
                    categoryIDFilterString = catstring.toString().replace(/,/g, '');
                }
                if (pricerangeQuery && catstring.length > 1) {
                    CurrentProductModel.set('filter', '(' + categoryIDFilterString.toString().substr(4) + ')' + pricerangeQuery.toString());
                } else if (pricerangeQuery && catstring.length === 1) {
                    CurrentProductModel.set('filter', categoryIDFilterString.toString().substr(4) + pricerangeQuery.toString());
                } else if (pricerangeQuery && !categoryIDFilterString) {
                    CurrentProductModel.set('filter', pricerangeQuery.toString().substr(5));
                } else {
                    CurrentProductModel.set('filter', categoryIDFilterString.toString().substr(4));
                }
            }

            if (window.searchStringValues) {
                CurrentProductModel.set('filterValue', 'isApplied eq true and ' + window.searchStringValues.toString());
            }

            var sortby = $('[data-mz-value="sortBy"]').val();
            if (sortby) {
                CurrentProductModel.set('sortBy', sortby);
            } 
            var totalCount = $("[data-mz-total-count]").data('mz-total-count');
            CurrentProductModel.set('pageSize', pageSize);
            CurrentProductModel.fetch().then(function(responseObject) {
                var prodContent = responseObject.apiModel.data.items;
                var productLength = prodContent.length;
                var prodIndex = null,
                    viewClass = null;
                if ($(".mz-productlist-item").hasClass("list") || $('[data-mz-product-list-view]').hasClass('active')) {
                    viewClass = 'list';
                } else {
                    viewClass = 'grid';
                }
                if (window.priceSlider === true) {
                    $("[data-mz-total-count]").text(responseObject.get("totalCount") + ' results');
                }
                if (productLength && liLength <= totalCount) {
                    $("#more-product").find('span').removeClass('hidden');
                    /*$("#more-product").find('img').addClass('hidden');*/
                    if (window.priceSlider === true) {
                        $('li.mz-productlist-item').remove();
                        $("[data-mz-total-count]").text(responseObject.get("totalCount") + ' results');
                    }
                    var productIdsArray = [];
                    for (var i = 0; i < prodContent.length; i++) {
                        prodCode = prodContent[i].productCode;
                        prodIndex = [i];
                        productIdsArray.push(prodCode);
                        self.$el.find(".mz-productlist-list .product-container").before('<li class="mz-productlist-item ' + viewClass + ' product-container' + prodIndex + prodCode + '" id="mz-productlist-item" data-mz-product="' + prodCode + '"></li>');
                    }

                    _.each(productIdsArray, function(prodCode, index) {
                        api.get('product', prodCode).then(function(productModel) {
                            var currentProdModel = new ProductModels.Product(productModel.data);
                            var productCode = currentProdModel.get("productCode");
                            var selector = $('.product-container' + index + productCode);
                            var productView = new ProductView({
                                el: selector,
                                model: currentProdModel
                            });
                            productView.render();
                        });
                    });
                    $("#more-product").removeClass('active');
                    if (window.priceSlider === true) {
                        $('body').animate({
                            scrollTop: 200
                        });
                    }
                    productLoad = false;
                    window.priceSlider = false;
                } else {
                    $("#more-product").find('span').addClass('hidden');
                    /*$("#more-product").find('img').removeClass('hidden');*/
                    if ($("[data-mz-total-count]").text() === "0 results") {
                        $('li.mz-productlist-item').remove();
                    }
                    productLoad = false;
                    window.priceSlider = false;
                }
            });
        },

        colorSwatching: function(e) {
            e.preventDefault();
            if (eFlag === 0) {
                eFlag = 1;
                var $currentEvtSource = $(e.currentTarget);
                $currentEvtSource.closest('.mz-productlist-item').find('input').css({
                    'border': 'none'
                });
                $currentEvtSource.css({
                    'border': '2px solid #4a4a4a'
                });
                var productCode = $currentEvtSource.closest('.mz-productlist-item').data('mz-product');

                var swatchCol = $currentEvtSource.attr('value').toLowerCase();
                var swatchColor = $currentEvtSource.attr('value');

                var mainImage = $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer').attr("data-main-image-src");

                var url = window.location.origin;
                $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer').removeClass('active');
                $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').addClass('active');
                var CurrentProductModel = new ProductModelColor();
                CurrentProductModel.set('filter', 'productCode eq ' + productCode);

                CurrentProductModel.fetch().then(function(responseObject) {
                    var prodContent = responseObject.apiModel.data.items;
                    var prodImg = null,
                        ImgAltText = null;
                    var flag = 0;

                    _.each(prodContent, function(productImages) {
                        prodImg = _.findWhere(productImages.content.productImages, {
                            altText: swatchColor || swatchCol
                        });
                    });
                    if (prodImg) {
                        var prodImage = prodImg.imageUrl;
                        ImgAltText = prodImg.altText;
                        $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer').attr({
                            "srcset": prodImage + "?max=400",
                            "alt": ImgAltText,
                            "style": ""
                        }).addClass('active');
                        $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                        eFlag = 0;
                    } else {
                        $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer').attr({
                            "srcset": mainImage + "?max=400",
                            "style": ""
                        }).addClass('active');
                        $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                        eFlag = 0;
                    }
                });
            }
        },
        addToWishlist: function(e) {
            e.preventDefault();
            var qvProductCode = $(e.currentTarget).data("listing-prod-code");
            var currentWishListBtn = e.currentTarget;

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
                    var product = new ProductModels.Product({
                        productCode: qvProductCode
                    });
                    product.addToWishlist({
                        quantity: 1
                    });

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
        addedToWishlist: function() {
            var productCodesShown = [];
            var productsWishlistBtns = [];
            var productCodesShownIndex = 0;

            $('.mz-productlist-item').each(function() {
                var wishlistBtn = $(this).find("a.wishlist-button");
                var listingProductCode = $(wishlistBtn).data("listing-prod-code");
                productCodesShown[productCodesShownIndex] = listingProductCode;
                productsWishlistBtns[productCodesShownIndex] = wishlistBtn;
                productCodesShownIndex++;
            });
            var isUserAnonymous = require.mozuData('user').isAnonymous;             
            var isAuthenticated = require.mozuData('user').isAuthenticated;
            if (isUserAnonymous === false && isAuthenticated === true) {
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
        render: function() {
            var self = this;
            this.windowScroll();
            var isUserAnonymous = require.mozuData('user').isAnonymous;             
            var isAuthenticated = require.mozuData('user').isAuthenticated;
            if (isUserAnonymous === false && isAuthenticated === true) {
                self.addedToWishlist();
            }
        }
    });
    /*Rahul- Product Grid End*/

    $(document).ready(function() {
        
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-search]'),
            $facets: $('[data-mz-facets]'),
            data: require.mozuData('facetedproducts')
        });

        window.productViewListGrid = new ProductViewListGrid();

    });

});