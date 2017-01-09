/* global angular */
define([
        'modules/jquery-mozu',
        'underscore',
        'modules/backbone-mozu',
        'modules/models-cart',
        'modules/cart-monitor',
        'modules/preserve-element-through-render',
        "vendor/jquery.cookie/jquery.cookie"
    ],
    function($, _, Backbone, CartModels, CartMonitor, preserveElement) {
        var ProductModelColor = Backbone.MozuModel.extend({
            mozuType: 'products'
        });

        // declare a MozuView that can rewrite its contents with a Hypr template
        var creteAccountFrm;
        var SoftCartView = Backbone.MozuView.extend({
            templateName: "modules/soft-cart",
            initialize: function() {
                var me = this;

                //setup coupon code text box enter.
                this.listenTo(this.model, 'change:couponCode', this.onEnterCouponCode, this);
                this.codeEntered = !!this.model.get('couponCode');
                this.$el.on('keypress', 'input', function(e) {
                    if (e.which === 13) {
                        console.warn('enter key was pressed');
                        if (me.codeEntered) {
                            console.warn('me.codeEntered true');
                            me.handleEnterKey();
                        } else {
                            console.warn('me.codeEntered FALSE');
                        }
                        return false;
                    }
                });

                // making these available globally
                console.info('------------- soft-cart.js --------------');
                window.angularQueue = window.angularQueue || [];
                window.activateAngularMaterial = window.activateAngularMaterial || activateAngularMaterial;
                window.loadAngular = window.loadAngular || loadAngular;

                activateAngularMaterial(['createAccount', 'promo-code-form', 'login-container']);


                function activateAngularMaterial(container) {
                    console.warn('ACTIVATE ANGULAR MATERIAL', container);

                    if (container && container.constructor == String && window.angularQueue.indexOf(container) === -1) {
                        window.angularQueue.push(container);
                    }
                    if (container && container.constructor == Array) {
                        for (var j = 0, lent = container.length; j < lent; j += 1) {
                            if (window.angularQueue.indexOf(container[j]) === -1) {
                                window.angularQueue.push(container[j]);
                            }
                        }
                    }

                    if (window.angularLoading) {
                        console.warn('*********************** angular is already loading, bailing on activateAngularMaterial() *****************');
                        return;
                    }
                    if (!window.angularLoaded) {
                        window.angularLoading = true;
                        loadAngular();
                        return;
                    }


                    for (var i = 0, len = window.angularQueue.length; i < len; i += 1) {
                        //window.angularQueue.push(container[i]);
                        bootstrapContainer(window.angularQueue[i]);
                    }

                    function bootstrapContainer(containerId) {
                        //var cartStateWrapper = document.getElementById('cartStateWrapper');
                        //if (cartStateWrapper && ! cartStateWrapper.hasAttribute('ng-controller')) {
                        //  cartStateWrapper.setAttribute('ng-controller', 'CartStateController as cartState');
                        //  angular.bootstrap(cartStateWrapper, ['CartState']);
                        //}

                        var containerElement = document.getElementById(containerId);
                        if (containerElement && !containerElement.hasAttribute('ng-controller')) {
                            containerElement.setAttribute('ng-controller', 'FormController');
                            containerElement.className = containerElement.className.replace(/(^|\s)hide-loading(?!\S)/g, ''); // == removeClass('hide-loading')
                            window.angular.bootstrap(containerElement, ['MaterialFields']);
                        }

                    }
                }

                function loadAngular() {
                    /* Angular does not use the AMD pattern, and needs to load these scripts in order */
                    var angularPaths = {
                        base: 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js',
                        animate: 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-animate.min.js',
                        aria: 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-aria.min.js',
                        material: 'https://ajax.googleapis.com/ajax/libs/angular_material/0.11.2/angular-material.min.js'
                    };

                    function loadAngularScript(path, callback) {
                        $.ajax({
                            url: path,
                            dataType: "script",
                            success: callback
                        });
                    }

                    loadAngularScript(angularPaths.base, loadAngularAnimate);

                    function loadAngularAnimate() {
                        loadAngularScript(angularPaths.animate, loadAngularAria);
                    }

                    function loadAngularAria() {
                        loadAngularScript(angularPaths.aria, loadAngularMaterial);
                    }

                    function loadAngularMaterial() {
                        loadAngularScript(angularPaths.material, loadAngularModule);
                    }

                    function loadAngularModule() {
                        window.angular.module('MaterialFields', ['ngMaterial'])
                            .config(['$interpolateProvider',
                                function($interpolateProvider) {
                                    $interpolateProvider.startSymbol('[[').endSymbol(']]');
                                }
                            ])
                            .controller('FormController', ['$scope',
                                function($scope) {

                                    $scope.syncSelect = function(key, dummyFieldValue) {
                                        if (key === 'ship-to-state') {
                                            window.checkoutViews.steps.shippingAddress.model.attributes.address.attributes.stateOrProvince = dummyFieldValue;
                                            return;
                                        }
                                        if (key === 'payment-card-month') {
                                            window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.expireMonth = dummyFieldValue;
                                            return;
                                        }
                                        if (key === 'payment-card-year') {
                                            window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.expireYear = dummyFieldValue;
                                            return;
                                        }
                                    };

                                    $scope.syncShippingMethod = function() {
                                        console.warn('syncShippingMethod()');

                                        $('#shipping-methods md-radio-button').each(function() {

                                            var shippingMethod = $(this);
                                            if (shippingMethod.attr('value') == $scope.shipping.code) {

                                                // Get input
                                                var input = $(this);

                                                // Update model
                                                window.checkoutViews.steps.shippingInfo.model.attributes.currencyCode = input.data('currency');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.isValid = input.data('valid');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.price = input.data('price');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodCode = input.data('code');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodName = input.data('name');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingZoneCode = input.data('zone');
                                            }
                                        });
                                    };

                                    $scope.shippingMethodClick = function() {
                                        console.warn('shippingMethodClick()');

                                        $('#shipping-methods md-radio-button.md-checked').each(function() {

                                            var shippingMethod = $(this);
                                            if (true || shippingMethod.attr('value') == $scope.shipping.code) {

                                                // Get input
                                                var input = $(this);

                                                // Update model
                                                window.checkoutViews.steps.shippingInfo.model.attributes.currencyCode = input.data('currency');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.isValid = input.data('valid');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.price = input.data('price');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodCode = input.data('code');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodName = input.data('name');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingZoneCode = input.data('zone');
                                            }
                                        });
                                    };

                                    $scope.syncSavedAddress = function() {

                                        $('#shipping-methods md-radio-button').each(function() {

                                            var shippingMethod = $(this);
                                            if (shippingMethod.attr('value') == $scope.shipping.code) {

                                                // Get input
                                                var input = $(this);

                                                // Update model
                                                window.checkoutViews.steps.shippingInfo.model.attributes.currencyCode = input.data('currency');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.isValid = input.data('valid');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.price = input.data('price');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodCode = input.data('code');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodName = input.data('name');
                                                window.checkoutViews.steps.shippingInfo.model.attributes.shippingZoneCode = input.data('zone');
                                            }
                                        });
                                    };

                                    $scope.formatPhone = function(n) {
                                        n = n.replace(' ', '');
                                        n = n.replace('-', '');
                                        n = n.replace('(', '');
                                        n = n.replace(')', '');
                                        if (n.length === 0) {
                                            return n;
                                        }
                                        if (n.length > 0 && n.length <= 3) {
                                            return '(' + n + ')';
                                        }
                                        if (n.length > 3 && n.length <= 6) {
                                            return '(' + n.substring(0, 3) + ') ' + n.substring(3, n.length);
                                        }
                                        if (n.length > 6) {
                                            return '(' + n.substring(0, 3) + ') ' + n.substring(3, 6) + '-' + n.substring(6, n.length);
                                        }
                                        return n;
                                    };

                                    $scope.cardType = 'clear';

                                    $scope.syncCreditCardType = function(cardNumber) {
                                        var prefix,
                                            len = cardNumber.length;
                                        if (len >= 4) {
                                            prefix = cardNumber.slice(0, 4);
                                            if (prefix === '6011') {
                                                console.info('setting DISCOVER');
                                                $scope.cardType = 'discover';
                                                window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.paymentOrCardType = 'DISCOVER';
                                                return;
                                            }
                                        }
                                        if (len >= 2) {
                                            prefix = cardNumber.slice(0, 2);
                                            if (prefix === '34' || prefix === '37') {
                                                console.info('setting AMEX');
                                                $scope.cardType = 'amex';
                                                window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.paymentOrCardType = 'AMEX';
                                                return;
                                            }
                                            if (prefix === '51' || prefix === '52' || prefix === '53' || prefix === '54' || prefix === '55') {
                                                console.info('setting MC');
                                                $scope.cardType = 'mastercard';
                                                window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.paymentOrCardType = 'MC';
                                                return;
                                            }
                                        }
                                        if (len >= 1) {
                                            prefix = cardNumber[0];
                                            if (prefix === '4') {
                                                console.info('setting VISA');
                                                $scope.cardType = 'visa';
                                                window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.paymentOrCardType = 'VISA';
                                                return;
                                            }
                                        }
                                        $scope.cardType = 'clear';
                                    };

                                    $scope.showCouponInterface = function() {
                                        var cancelButton = document.getElementById('coupon-cancel');
                                        var couponButton = document.getElementById('coupon-button');

                                        cancelButton.className = cancelButton.className.replace(/(^|\s)ng-hide(?!\S)/g, ''); // == removeClass('ng-hide')
                                        couponButton.className = couponButton.className.replace(/(^|\s)ng-hide(?!\S)/g, ''); // == removeClass('ng-hide')
                                    };

                                    $scope.hideCouponInterface = function() {
                                        var cancelButton = document.getElementById('coupon-cancel');
                                        var couponButton = document.getElementById('coupon-button');

                                        window.setTimeout(function() {
                                            cancelButton.className = cancelButton.className + " ng-hide";
                                            couponButton.className = couponButton.className + " ng-hide";
                                        }, 100); // giving time to register the click on either of the above elements
                                    };

                                    $scope.cancelInput = function(fieldId) {
                                        var field = document.getElementById(fieldId);
                                        field.parentNode.className = field.parentNode.className.replace(/(^|\s)md-input-has-value(?!\S)/g, ''); // == removeClass('md-input-has-value')
                                        field.value = '';
                                    };

                                }
                            ]);

                        //angular.module('CartState', [])
                        //  .config(['$interpolateProvider', function($interpolateProvider) {
                        //    $interpolateProvider.startSymbol('[[').endSymbol(']]');
                        //  }])
                        //  .controller('CartStateController', ['$scope', function($scope){
                        //    console.log('controller hello');
                        //    var cartState = this;
                        //
                        //    cartState.step = 1;
                        //
                        //    console.log('cartState.step',cartState.step);
                        //
                        //    cartState.setStep = setStep;
                        //
                        //    function setStep(step) {
                        //      cartState.step = step;
                        //    }
                        //
                        //  }]);

                        window.angularLoaded = true;
                        window.angularLoading = false;
                        activateAngularMaterial();
                    }
                }




            },
            goToCart: function() {
                window.location = "/cart";
                return false;
            },
            changeQuantity: function(e, amt) {
                var $qField = $(e.currentTarget),
                    id = $qField.data('mz-cart-item'),
                    item = this.model.get("items").get(id);
                item.set('quantity', item.get('quantity') + amt);
                return item.saveQuantity();
            },
            increaseQuantity: function(e) {
                return this.changeQuantity(e, 1);
            },
            decreaseQuantity: function(e) {
                return this.changeQuantity(e, -1);
            },
            removeItem: function(e) {
                var $removeButton = $(e.currentTarget),
                    id = $removeButton.data('mz-cart-item');
                this.model.removeItem(id);
                return false;
            },
            showAccount: function(e) {

                $.removeCookie('currentStepIndex', {
                    expires: 30
                });
                var isUserAnonymous = require.mozuData('user').isAnonymous;
                if (isUserAnonymous === true) {
                    $("#createAccount").show();
                    if (creteAccountFrm === undefined) {
                        creteAccountFrm = $("#createAccount");
                    }
                    $(".soft-cart-wrap").append(creteAccountFrm);
                    $(".soft-cart").hide();

                    window.activateAngularMaterial(['createAccount']);
                    //alert('soft-cart.js: showAccount()');
                    $('body').animate({
                        scrollTop: 0
                    }, 1000);
                } else {
                    var promoCode = $(".promo-code-text").val();
                    //$.cookie('promoCode', "" + promoCode + "", { expires: 30, path: '/' });
                    var expDate = new Date();
                    expDate.setMonth(expDate.getMonth() + 1);
                    document.cookie = "promoCode=" + escape("" + promoCode) + ";expires=" + expDate.toGMTString() + "; path=/";
                    window.location = "/cart/checkout";
                }
            },
            addCoupon: function() {
                console.info("addCoupon");

                var self = this;
                console.info('model BEFORE internal addcoupon method', self.model);
                this.model.addCoupon().ensure(function() {
                    console.info('model at start of ENSURE function', self.model);
                    self.model.unset('couponCode');
                    console.info('model after UNSET of couponCode', self.model);
                    self.render();
                });
            },
            onEnterCouponCode: function(model, code) {
                if (code && !this.codeEntered) {
                    this.codeEntered = true;
                    this.$el.find('#cart-coupon-code').prop('disabled', false);
                }
                if (!code && this.codeEntered) {
                    this.codeEntered = false;
                    this.$el.find('#cart-coupon-code').prop('disabled', true);
                }
            },
            autoUpdate: [
                'couponCode'
            ],
            handleEnterKey: function() {
                this.addCoupon();
            },
            //close button mybag
            clickClose: function() {
                $('.mask').fadeOut();
                $('#page-wrapper').removeClass('cartOpen');
                $(".soft-cart-wrap").removeClass('is-active');
                $('body').animate({
                    scrollTop: 0
                }, 400);
            },
            priceFunction: function() {
                $('.soft-cart-total-amount').each(function() {
                    var amountText = $(this).data("total-amount");
                    var amountString = amountText.toString();
                    var amountDollar = amountString.charAt(0);
                    var totalp = amountString.split(amountDollar);
                    var decimal = totalp[1].split('.');
                    var afterDecimal = decimal[1];
                    if (afterDecimal == '00') {
                        $(this).html('<span class="dollar">' + amountDollar + '</span>' + decimal[0]);
                    } else {
                        $(this).html('<span class="dollar">' + amountDollar + '</span>' + '<span class="interger">' + decimal[0] + '</span>' + '.' + decimal[1]);
                    }
                });
            },
            colorImage: function() {
                var productCodeArray = [];
                var swatchColArray = [];
                var mainImage;
                var selfArray = [];
                var mainImageArray = [];
                $('.soft-cart-item').each(function() {
                    var self = $(this);
                    selfArray.push(self);
                    var productCode = $(this).data('mz-item-code');
                    productCodeArray.push(productCode);
                    var swatchCol = $(this).find('[data-mz-item-color]').data('mz-item-color');
                    if (swatchCol) {
                        var lowerSwatch = swatchCol.toLowerCase();
                        swatchColArray.push(lowerSwatch);
                    } else {
                        swatchColArray.push('undefined');
                    }
                    mainImage = $(this).find('.mainImageUrl').data('mz-main-imgurl');
                    mainImageArray.push(mainImage);
                });
                var CurrentProductModel = new ProductModelColor();

                var filterString = [];
                _.each(productCodeArray, function(productCode, index) {
                    var productCodeFilter = 'productCode eq ';
                    productCodeFilter += productCode + ' or ';
                    filterString.push(productCodeFilter);
                });
                var string = filterString.toString().replace(/,/g, '');
                var string1 = string.replace(/"/g, '');
                var finalFilter = string1.substring(0, string1.length - 4);
                CurrentProductModel.set('filter', finalFilter);
                CurrentProductModel.fetch().then(function(responseObject) {
                    var prodContent = responseObject.apiModel.data.items;
                    var prodImg = null,
                        prodImgAltText = null,
                        ImgAltText = null;
                    _.each(productCodeArray, function(productCode1, index) {
                        var flag = 0;
                        _.each(prodContent, function(pCode, index2) {
                            if (productCode1 === pCode.productCode) {
                                for (var i = 0; i < productCodeArray.length; i++) {
                                    var prodImgs = pCode.content.productImages;
                                    for (var j = 0; j < prodImgs.length; j++) {
                                        var productAtlText = pCode.content.productImages[j].altText;
                                        if (productAtlText) {
                                            prodImgAltText = productAtlText.toLowerCase();
                                            if (prodImgAltText === swatchColArray[index]) {
                                                prodImg = pCode.content.productImages[j].imageUrl;
                                                var productATLText = pCode.content.productImages[j].altText;
                                                if (flag === 0) {
                                                    selfArray[index].find('.soft-cart-item-image').attr({
                                                        "src": prodImg + "?max=200",
                                                        "style": "max-width: 80%;"
                                                    });
                                                    flag++;
                                                }
                                            } else if (flag === 0) {
                                                selfArray[index].find('.soft-cart-item-image').attr({
                                                    "src": mainImageArray[index] + "?max=200",
                                                    "style": "max-width: 80%;"
                                                });
                                            }
                                        } else if (productAtlText !== swatchColArray[index] && flag === 0) {
                                            selfArray[index].find('.soft-cart-item-image').attr({
                                                "src": mainImageArray[index] + "?max=200",
                                                "style": "max-width: 80%;"
                                            });
                                        }
                                    }
                                }
                            }
                        });
                    });
                });
                $('.soft-cart-item').each(function() {
                    if ($(this).find('.optionvalue').length === 1) {
                        $(this).find('.commaClass').hide();
                    }
                });

            },

            render: function() {
                preserveElement(this, ['#mobile-menu-icon'], function() {
                    Backbone.MozuView.prototype.render.call(this, arguments);
                });
                this.priceFunction();
                this.colorImage();

                Backbone.MozuView.prototype.render.apply(this, arguments);
                this.priceFunction();
                this.colorImage();
                window.activateAngularMaterial('promo-code-form');

            }
        });
        // accessors for other modules
        var SoftCartInstance = {
            update: function() {

                // populate the cart model asynchronously from the api
                return this.model.apiGet();
            },
            show: function() {

                var expDate = new Date();
                expDate.setMonth(expDate.getMonth() - 2);
                /*global escape: true */
                var stepInd = "0";
                stepInd = escape(stepInd);
                var promoCd = "";
                promoCd = escape(promoCd);
                document.cookie = "currentStepIndex=" + stepInd + ";expires=" + expDate.toGMTString() + "; path=/";
                document.cookie = "promoCode=" + promoCd + ";expires=" + expDate.toGMTString() + "; path=/";
                this.view.$el.addClass('is-active');
                //open slide mybag
                if (this.view.$el.addClass('is-active')) {
                    $('.mask').fadeIn();
                    $('#page-wrapper').addClass('cartOpen');
                    $('body').delay(1300).animate({
                        scrollTop: 0
                    }, 500);

                    var headerHeight = $('.soft-cart-wrap').find('.cartHeader').innerHeight();
                    var totalHeight = $('.soft-cart-wrap').find('.totalDiv').innerHeight();
                    var windowHeight = $(window).height();
                    //$('.soft-cart-wrap').css("max-height", windowHeight);
                    var height = windowHeight - (headerHeight + totalHeight);
                    $(document).find('.soft-cart-items').css("max-height", height);
                    $(window).resize(function() {
                        var windowHeight = $(window).height();
                        var height = windowHeight - (headerHeight + totalHeight);
                        $(document).find('.soft-cart-items').css("max-height", height);
                    });
                    $('.soft-cart-total-amount').each(function() {
                        var amountText = $(this).data("total-amount");
                        var amountString = amountText.toString();
                        var amountDollar = amountString.charAt(0);
                        var totalp = amountString.split(amountDollar);
                        var decimal = totalp[1].split('.');
                        var afterDecimal = decimal[1];
                        if (afterDecimal == '00') {
                            $(this).html('<span class="dollar">' + amountDollar + '</span>' + decimal[0]);
                        } else {
                            $(this).html('<span class="dollar">' + amountDollar + '</span>' + '<span class="interger">' + decimal[0] + '</span>' + '.' + decimal[1]);
                        }
                    });
                }

                var self = this;
                // dismisser method so that a click away will hide the softcart
                $('.mask').on('click', function(e) {
                    self.view.$el.removeClass('is-active');
                    $('#page-wrapper').removeClass('cartOpen');
                    $('body').animate({
                        scrollTop: 0
                    }, 400);
                });
            },
            highlightItem: function(itemid) {
                this.view.$('.soft-cart-item[data-mz-cart-item="' + itemid + '"]').removeClass('highlight').addClass('highlight');
            }
        };

        $(document).ready(function() {

            // create a blank cart model
            SoftCartInstance.model = new CartModels.Cart();


            SoftCartInstance.model.on('sync', function() {
                CartMonitor.setCount(SoftCartInstance.model.count());

                $(document).trigger("cartChanged", [SoftCartInstance.model]);
            });
            // instantiate your view!
            SoftCartInstance.view = new SoftCartView({
                el: $('[data-mz-role="soft-cart"]'),
                model: SoftCartInstance.model
            });

            console.warn('SoftCartInstance:', SoftCartInstance);
            // bind a method we'll be using for the promise
            SoftCartInstance.show = $.proxy(SoftCartInstance.show, SoftCartInstance);
            // bind cart links to open the softcart instead

            $(document).on('click', '#myBag', function(e) {
                e.preventDefault();
                SoftCartInstance.update().then(SoftCartInstance.show);
            });
            // bind cart links to open the softcart instead
            $(document.body).on('click', '.soft-cart-checkout-btn, .applyPromoCode', function(e) {
                e.preventDefault();
                var promoCode = $(".promo-code-text").val();

                console.info('applying promo code?', promoCode);
                //$.cookie('promoCode', "" + promoCode + "", { expires: 30, path: '/' });
                /*global escape: true */
                var promoCd = "" + promoCode;
                promoCd = escape(promoCd);
                var stepInd = "0";
                stepInd = escape(stepInd);
                var expDate = new Date();
                expDate.setMonth(expDate.getMonth() + 1);
                document.cookie = "promoCode=" + promoCd + ";expires=" + expDate.toGMTString() + "; path=/";
                var expDate2 = new Date();
                expDate2.setMonth(expDate2.getMonth() - 2);
                document.cookie = "currentStepIndex=" + stepInd + ";expires=" + expDate2.toGMTString() + "; path=/";
                // window.location = "/cart/checkout";
            });

            CartMonitor.$el = $('[data-mz-role="cartmonitor"]');
            CartMonitor.update();
            SoftCartInstance.update();
        });
        // export the singleton
        return SoftCartInstance;
    });