require([
    "modules/jquery-mozu",
    "underscore",
    "hyprlive",
    "modules/backbone-mozu",
    "modules/models-checkout",
    "modules/views-messages",
    "modules/cart-monitor",
    "hyprlivecontext",
    "modules/preserve-element-through-render"
],
function ($, _, Hypr, Backbone, CheckoutModels, messageViewFactory, CartMonitor, HyprLiveContext, preserveElements) {


var pageContext = require.mozuData('pagecontext');
    var CheckoutStepView = Backbone.MozuView.extend({
        edit: function () {
            this.model.edit();
        },
        next: function () {
            // wait for blur validation to complete
            var me = this;
            _.defer(function () {
                me.model.next();
            });
        },
        cancel: function(){
            this.model.cancelStep();
        },
        choose: function () {
            var me = this;
            me.model.choose.apply(me.model, arguments);
        },
        constructor: function () {
            var me = this;
            Backbone.MozuView.apply(this, arguments);
            me.resize();
            setTimeout(function () {
                me.$('.mz-panel-wrap').css({ 'overflow-y': 'hidden'});
            }, 250);
            me.listenTo(me.model,'stepstatuschange', me.render, me);
            me.$el.on('keypress', 'input', function (e) {
                if (e.which === 13) {
                    me.handleEnterKey(e);
                    return false;
                }
            });
        },
        initStepView: function() {
            this.model.initStep();
        },
        handleEnterKey: function (e) {
            this.model.next();
        },
        render: function () {
            console.info('CheckoutStepView render()', this);
            this.$el.removeClass('is-new is-incomplete is-complete is-invalid').addClass('is-' + this.model.stepStatus());
            Backbone.MozuView.prototype.render.apply(this, arguments);
            this.resize();

            // SUDHIR
            var maxBorderBlockHeight = Math.max.apply(null, $(".checkout-steps-master").map(function ()
            {
                return $(this).height();
            }).get());

            $("div.border-layer").css("height", maxBorderBlockHeight+"px");

            var selectedAddressId = window.checkoutViews.steps.shippingAddress.model.attributes.id;

            if(selectedAddressId !== undefined || selectedAddressId !== 'undefined') {
                $("#step-shipping-address").find("[value='"+ selectedAddressId +"']").prop("checked", true);
            }
            $(document).off("click", ".mz-contactselector-contact");
            $(document).on("click", ".mz-contactselector-contact", function (e) {
                //var newContactId = $(e.currentTarget).find("[data-mz-value='contactId']").val();
                var newContactId = $(e.currentTarget).find("[data-contact-id]").attr('data-contact-id');

                if(newContactId != "new") {
                    try{
                      window.checkoutViews.steps.shippingAddress.model.setCurrentContactId(newContactId);
                    }
                    catch(er) {
                      console.log('ERROR',er);
                    }
                }

                $( "body" ).trigger({ type:"checkoutStepChanged", nextStep: 0 });
            });
        },
        resize: _.debounce(function () {
            this.$('.mz-panel-wrap').animate({'height': this.$('.mz-inner-panel').outerHeight() });
        },200)
    });

    var OrderSummaryView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/checkout-order-summary',

        initialize: function () {
            this.listenTo(this.model.get('billingInfo'), 'orderPayment', this.onOrderCreditChanged, this);
        },

        editCart: function () {
            window.location = "/cart";
        },

        onOrderCreditChanged: function (order, scope) {
            this.render();
        },

        // override loading button changing at inappropriate times
        handleLoadingChange: function () { }
    });

    var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
    //var pageContext = require.mozuData('pagecontext');
    var ShippingAddressView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-shipping-address',
        autoUpdate: [
            'firstName',
            'lastNameOrSurname',
            'address.address1',
            'address.address2',
            'address.address3',
            'address.cityOrTown',
            'address.countryCode',
            'address.stateOrProvince',
            'address.postalOrZipCode',
            'address.addressType',
            'phoneNumbers.home',
            'contactId'
        ],
        renderOnChange: [
            'address.countryCode',
            'contactId'
        ]
    });

    var ShippingInfoView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-shipping-method',
        renderOnChange: [
            'availableShippingMethods'
        ],
        additionalEvents: {
            "change [data-mz-shipping-method]": "updateShippingMethod"
        },
        initialize: function() {
          console.warn('ShippingInfoView.initialize()', this);
          this.model.set('isValid', false);
          this.model.unset('price');
          this.model.unset('shippingMethodCode');
          this.model.unset('shippingMethodName');
          this.model.unset('shippingZoneCode');
          this.model.unset('currencyCode');
          console.warn('unset the shipping method',this);
        },
        updateShippingMethod: function (e) {
            console.warn('ShippingInfoView.updateShippingMethod()', $(e.currentTarget).val());
            var selectedShippingMethod = $(e.currentTarget).val();
            this.model.updateShippingMethod(selectedShippingMethod);
        },
        render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);
            console.warn('RENDER for ShippingInfoView', this.model);

          if($("#step-shipping-method").hasClass("hideStep")) {
            console.info('#### Bailing early, ShippingInfoView is not on a valid step!');
            return;
          }
          setTimeout(function(){
            window.sortShippingMethods();
            window.activateAngularMaterial(['step-shipping-method-contents']);
            $("#shipping-methods").on('click', function() {
              console.warn('shipping method click!');
                console.log('looking for val from shipping method');
                var selectedShippingMethodEl = $('.shipping-method-option.md-checked md-radio-button'),
                  selectedShippingMethod = selectedShippingMethodEl.attr('value');
                console.log('el',selectedShippingMethodEl);
                console.log('val=',selectedShippingMethod);
                this.model.updateShippingMethod(selectedShippingMethod);
                console.log('set the model',this.model);
            }.bind(this));
          }.bind(this), 100);
        }

    });

    var BillingInfoView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-payment-info',
        autoUpdate: [
            'savedPaymentMethodId',
            'paymentType',
            'card.paymentOrCardType',
            'card.cardNumberPartOrMask',
            'card.nameOnCard',
            'card.expireMonth',
            'card.expireYear',
            'card.cvv',
            'card.isCardInfoSaved',
            'check.nameOnCheck',
            'check.routingNumber',
            'check.checkNumber',
            'isSameBillingShippingAddress',
            'billingContact.firstName',
            'billingContact.lastNameOrSurname',
            'billingContact.address.address1',
            'billingContact.address.address2',
            'billingContact.address.address3',
            'billingContact.address.cityOrTown',
            'billingContact.address.countryCode',
            'billingContact.address.stateOrProvince',
            'billingContact.address.postalOrZipCode',
            'billingContact.phoneNumbers.home',
            'billingContact.email',
            'creditAmountToApply',
            'digitalCreditCode'
        ],
        renderOnChange: [
            'savedPaymentMethodId',
            'billingContact.address.countryCode',
            'paymentType',
            'isSameBillingShippingAddress'
        ],
        additionalEvents: {
            "change [data-mz-digital-credit-enable]": "enableDigitalCredit",
            "change [data-mz-digital-credit-amount]": "applyDigitalCredit",
            "change [data-mz-digital-add-remainder-to-customer]": "addRemainderToCustomer"
        },
        initialize: function () {
            this.listenTo(this.model, 'change:digitalCreditCode', this.onEnterDigitalCreditCode, this);
            this.listenTo(this.model, 'orderPayment', function (order, scope) {
                    this.render();
                }, this);
            this.codeEntered = !!this.model.get('digitalCreditCode');
        },
        render: function () {
            console.log('checkout.js: render()', this, arguments);
            preserveElements(this, ['.v-button', '.p-button'], function() {
                CheckoutStepView.prototype.render.apply(this, arguments);
            });
            var status = this.model.stepStatus();
            if (visaCheckoutSettings.isEnabled && !this.visaCheckoutInitialized && this.$('.v-button').length > 0) {
                window.onVisaCheckoutReady = _.bind(this.initVisaCheckout, this);
                require([pageContext.visaCheckoutJavaScriptSdkUrl]);
                this.visaCheckoutInitialized = true;
            }
            window.loadAngular();
        },
        updateAcceptsMarketing: function(e) {
            this.model.getOrder().set('acceptsMarketing', $(e.currentTarget).prop('checked'));
        },
        toggleBillingAddress: function(e){
            this.model.toggleBillingAddress($(e.currentTarget).prop('checked'));
            
        },
        beginApplyCredit: function (e) {
            this.model.beginApplyCredit();
            this.render();
        },
        cancelApplyCredit: function () {
            this.model.closeApplyCredit();
            this.render();
        },
        finishApplyCredit: function () {
            var self = this;
            this.model.finishApplyCredit().then(function() {
                self.render();
            });
        },
        removeCredit: function (e) {
            var self = this,
                id = $(e.currentTarget).data('mzCreditId');
            this.model.removeCredit(id).then(function () {
                self.render();
            });
        },
        getDigitalCredit: function (e) {
            var self = this;
            this.$el.addClass('is-loading');
            this.model.getDigitalCredit().ensure(function () {
                self.$el.removeClass('is-loading');
            });
        },
        stripNonNumericAndParseFloat: function (val) {
            if (!val) return 0;
            var result = parseFloat(val.replace(/[^\d\.]/g, ''));
            return isNaN(result) ? 0 : result;
        },
        applyDigitalCredit: function(e) {
            var val = $(e.currentTarget).prop('value'),
                creditCode = $(e.currentTarget).attr('data-mz-credit-code-target');  //target
            if (!creditCode) {
                console.log('checkout.applyDigitalCredit could not find target.');
                return;
            }
            var amtToApply = this.stripNonNumericAndParseFloat(val);

            this.model.applyDigitalCredit(creditCode, amtToApply, true);
            this.render();
        },
        onEnterDigitalCreditCode: function(model, code) {
            if (code && !this.codeEntered) {
                this.codeEntered = true;
                this.$el.find('button').prop('disabled', false);
            }
            if (!code && this.codeEntered) {
                this.codeEntered = false;
                this.$el.find('button').prop('disabled', true);
            }
        },
        enableDigitalCredit: function(e) {
            var creditCode = $(e.currentTarget).attr('data-mz-credit-code-source'),
                isEnabled = $(e.currentTarget).prop('checked') === true,
                targetCreditAmtEl = this.$el.find("input[data-mz-credit-code-target='" + creditCode + "']"),
                me = this;

            if (isEnabled) {
                targetCreditAmtEl.prop('disabled', false);
                me.model.applyDigitalCredit(creditCode, null, true);
            } else {
                targetCreditAmtEl.prop('disabled', true);
                me.model.applyDigitalCredit(creditCode, 0, false);
                me.render();
            }
        },
        addRemainderToCustomer: function (e) {
            var creditCode = $(e.currentTarget).attr('data-mz-credit-code-to-tie-to-customer'),
                isEnabled = $(e.currentTarget).prop('checked') === true;
            this.model.addRemainingCreditToCustomerAccount(creditCode, isEnabled);
        },
        handleEnterKey: function (e) {
            var source = $(e.currentTarget).attr('data-mz-value');
            if (!source) return;
            switch (source) {
                case "creditAmountApplied":
                    return this.applyDigitalCredit(e);
                case "digitalCreditCode":
                    return this.getDigitalCredit(e);
            }
        },
        /* begin visa checkout */
        initVisaCheckout: function () {
            var me = this;
            var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
            var apiKey = visaCheckoutSettings.apiKey || '0H1JJQFW9MUVTXPU5EFD13fucnCWg42uLzRQMIPHHNEuQLyYk';
            var clientId = visaCheckoutSettings.clientId || 'mozu_test1';
            var orderModel = this.model.getOrder();

            // on success, attach the encoded payment data to the window
            // then call the sdk's api method for digital wallets, via models-checkout's helper
            window.V.on("payment.success", function(payment) {
                console.log({ success: payment });
                me.editing.savedCard = false;
                me.model.parent.processDigitalWallet('VisaCheckout', payment);
            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.cancel", function(payment) {
                console.log({ cancel: JSON.stringify(payment) });
            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.error", function(payment, error) {
                console.warn({ error: JSON.stringify(error) });
            });

            window.V.init({
                apikey: apiKey,
                clientId: clientId,
                paymentRequest: {
                    currencyCode: orderModel.get('currencyCode'),
                    subtotal: "" + orderModel.get('total')
            }
            });
        },
        /* end visa checkout */
        editPreviousStep: function () {
            $( "body" ).trigger({ type:"checkoutStepChanged", nextStep: 0 });
        }
    });

    var CouponView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/coupon-code-field',
        handleLoadingChange: function (isLoading) {
            // override adding the isLoading class so the apply button
            // doesn't go loading whenever other parts of the order change
        },
        initialize: function() {
            this.listenTo(this.model, 'change:couponCode', this.onEnterCouponCode, this);
            this.codeEntered = !!this.model.get('couponCode');
        },
        onEnterCouponCode: function (model, code) {
            if (code && !this.codeEntered) {
                this.codeEntered = true;
                this.$el.find('button').prop('disabled', false);
            }
            if (!code && this.codeEntered) {
                this.codeEntered = false;
                this.$el.find('button').prop('disabled', true);
            }
        },
        autoUpdate: [
            'couponCode'
        ],
        addCoupon: function (e) {
            // add the default behavior for loadingchanges
            // but scoped to this button alone
            var self = this;
            this.$el.addClass('is-loading');
            this.model.addCoupon().ensure(function() {
                self.$el.removeClass('is-loading');
                self.model.unset('couponCode');
                self.render();
            });
        },
        handleEnterKey: function () {
            this.addCoupon();
        }
    });

    var CommentsView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/comments-field',
        autoUpdate: ['shopperNotes.comments']
    });

    var ReviewOrderView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/step-review',
        autoUpdate: [
            'createAccount',
            'agreeToTerms',
            'emailAddress',
            'password',
            'confirmPassword'
        ],
        renderOnChange: [
            'createAccount',
            'isReady'
        ],
        initialize: function () {
            //window.checkoutViews.reviewPanel.model.attributes.agreeToTerms = true;
            var me = this;
            console.log('REVIEWORDERVIEW:', me);
            this.$el.on('keypress', 'input', function (e) {
                if (e.which === 13) {
                    me.handleEnterKey();
                    return false;
                }
            });
            this.model.on('passwordinvalid', function(message) {
                me.$('[data-mz-validationmessage-for="password"]').text(message);
            });
            this.model.on('userexists', function (user) {
                me.$('[data-mz-validationmessage-for="emailAddress"]').html(Hypr.getLabel("customerAlreadyExists", user, encodeURIComponent(window.location.pathname)));
            });

            me.model.attributes.agreeToTerms = true;
            //setTimeout(function(){ me.render(); }, 1000);
        },
            render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);

            $(".place-order").prop("disabled", false);
            //if($("#mz-terms-and-conditions").is(':checked')) {
            //    $(".place-order").prop("disabled", false);
            //    $(".t-c-msg").hide();
            //}
        },
        tcvalidation: function () {
            //if($("#mz-terms-and-conditions").is(':checked')) {
            //    $(".place-order").prop("disabled", false);
            //    $(".t-c-msg").hide();
            //}
            //else {
            //    $(".place-order").prop("disabled", true);
            //    $(".t-c-msg").show();
            //}
        },
        submit: function () {
            var self = this;
            _.defer(function () {
                self.model.submit();
            });
        },
        handleEnterKey: function () {
            this.submit();
        },
        editPreviousStep: function () {
            $( "body" ).trigger({ type:"checkoutStepChanged", nextStep: 2 });
        }
    });

    var currentStepIndex = null;
    var CheckoutStepModel = Backbone.Model.extend({
        defaults: {
            currentStepIndex: 0
        },
        initialize: function() {
            console.warn('CHECKOUTSTEPMODEL initialize()');
            currentStepIndex = parseInt($.cookie('currentStepIndex'),10);

            if(currentStepIndex === undefined || currentStepIndex === 'undefined' || currentStepIndex === null || currentStepIndex === 'null' || isNaN(currentStepIndex)) {
                currentStepIndex = 0;
            }
        },
        setStepIndex: function(stepIndex) {
            currentStepIndex = stepIndex;
            var stepInd = "";
            stepInd = window.escape(stepInd+stepIndex);
            var expDate = new Date();
            expDate.setMonth(expDate.getMonth()+1);
            document.cookie = "currentStepIndex="+stepInd+";expires="+expDate.toGMTString() + "; path=/";

            //$.cookie('currentStepIndex', "" + stepIndex + "", { expires: 30, path: '/' });

            this.manipulateUI();
        },
        manipulateUI: function() {
            var isInTabletMode = false;
            if(pageContext.isTablet || pageContext.isMobile) {
                isInTabletMode = true;
            }
            if(isInTabletMode) {
                $(".checkout-form").addClass("in-tablet-mode");
                $(".checkout-steps-master").addClass("in-tablet-mode");
                $(".checkout-steps-master > div").removeClass("col-xs-8 col-sm-8 col-md-8 col-lg-8");
                $(".checkout-steps-master > div").addClass("col-xs-24 col-sm-24 col-md-24 col-lg-24");
            }

            $("#step-shipping-method").removeClass("hideNextButton");
            $("#step-shipping-address").removeClass("hideNextButton");

            $("#step-shipping-method").removeClass("hideStep");

            $(".checkout-steps-master > div").removeClass("active");

            if(isInTabletMode) {
                $(".overlay").addClass("hideOverlay");

                $(".checkout-steps-tablet-master").removeClass("hidden");
                $(".checkout-steps-tablet-master > div").removeClass("active");

                $(".checkout-steps-master .topProgressBar").hide();
                $(".checkout-steps-master > div").addClass("hideStep");
            } else {
                $(".overlay").removeClass("hideOverlay");
            }

            var chooseShipAddress = $("#choose-ship-address-wrapper");

            console.warn('MANIPULATEUI()', currentStepIndex);
            switch (currentStepIndex) {
                case 0:
                    // Step 1 (Shipping Address)
                    $(".checkout-step-1").addClass("active");

                    $("#step-shipping-method").addClass("hideStep");

                    setTimeout(function(){
                      var chooseShipAddress = $("#choose-ship-address-wrapper");
                      if(chooseShipAddress) {
                        chooseShipAddress.removeClass('ship-address-chosen');
                      }
                    }, 1000);

                    if(isInTabletMode) {
                        $(".checkout-steps-tablet-master .checkout-step-1").addClass("active");

                        $(".checkout-steps-master .checkout-step-1").removeClass("hideStep");
                        $(".checkout-steps-master .checkout-step-2").addClass("hideStep");
                        $(".checkout-steps-master .checkout-step-3").addClass("hideStep");
                    } else {
                        $(".checkout-step-1 .overlay").addClass("hideOverlay");
                    }
                    break;
                case 1:
                    // Step 2 (Shipping Method)
                    if(chooseShipAddress) {
                      chooseShipAddress.addClass('ship-address-chosen');
                    }
                    $("#step-shipping-method").removeClass('is-complete');

                    if($("#step-shipping-method").hasClass("escape-payment-method")) {
                        // Step 3 (Payment)
                        $(".checkout-step-2").addClass("active");

                        $("#step-shipping-address").addClass("hideNextButton");

                        if(isInTabletMode) {
                            $(".checkout-steps-tablet-master .checkout-step-1").addClass("active");
                            $(".checkout-steps-tablet-master .checkout-step-2").addClass("active");

                            $(".checkout-steps-master .checkout-step-1").addClass("hideStep");
                            $(".checkout-steps-master .checkout-step-2").removeClass("hideStep");
                            $(".checkout-steps-master .checkout-step-3").addClass("hideStep");
                        } else {
                            $(".checkout-step-2 .overlay").addClass("hideOverlay");
                        }
                    } else {
                        $(".checkout-step-1").addClass("active");

                        $("#step-shipping-address").addClass("hideNextButton");

                        if(isInTabletMode) {
                            $(".checkout-steps-tablet-master .checkout-step-1").addClass("active");

                            $(".checkout-steps-master .checkout-step-1").removeClass("hideStep");
                            $(".checkout-steps-master .checkout-step-2").addClass("hideStep");
                            $(".checkout-steps-master .checkout-step-3").addClass("hideStep");
                        } else {
                            $(".checkout-step-1 .overlay").addClass("hideOverlay");
                        }
                    }
                    break;
              case 2:

                  // Step 3 (Payment)
                  var timeoutToActivate;

                  if (window.forcePaymentType) {
                    timeoutToActivate = 1000;
                  
                    window.forcePaymentType(); // sets it to credit card, defined in models-checkout.js
                    window.forceNameOnCard();
                    window.forceDefaultCard();
                  }
                  else {
                    timeoutToActivate = 4000;
                    setTimeout(function() {
                      window.forcePaymentType();
                      window.forceNameOnCard();
                      window.forceDefaultCard();
                    }, 3000);
                  }
                  if (window.forceBillingSameAsShipping) {
                    timeoutToActivate = 1000;
                    window.forceBillingSameAsShipping(); // defined in models-checkout.js
                  }
                  else {
                    timeoutToActivate = 4000;
                    setTimeout(function() {
                      window.populateBillingAddress(window.checkoutViews.steps.paymentInfo.model, true);
                      window.forceBillingSameAsShipping();
                    }, 3000);
                  }

                  $("#step-shipping-method").addClass('is-complete');

                  setTimeout(function(){
                      window.activateAngularMaterial(['newsletter-optin','billing-address','credit-card-payment']);
                    }.bind(this), timeoutToActivate);

                    $(".checkout-step-2").addClass("active");

                    $('#saved-payment-methods').removeClass('saved-payment-chosen');
                    $("#step-shipping-address").addClass("hideNextButton");

                    if(isInTabletMode) {
                        $(".checkout-steps-tablet-master .checkout-step-1").addClass("active");
                        $(".checkout-steps-tablet-master .checkout-step-2").addClass("active");

                        $(".checkout-steps-master .checkout-step-1").addClass("hideStep");
                        $(".checkout-steps-master .checkout-step-2").removeClass("hideStep");
                        $(".checkout-steps-master .checkout-step-3").addClass("hideStep");
                    } else {
                        $(".checkout-step-2 .overlay").addClass("hideOverlay");
                    }
                    break;
                case 3:
                    // Step 4 (Review)
                    $(".checkout-step-3").addClass("active");

                    $("#step-shipping-address").addClass("hideNextButton");
                    $('#saved-payment-methods').addClass('saved-payment-chosen');

                    if(isInTabletMode) {
                        $(".checkout-steps-tablet-master .checkout-step-1").addClass("active");
                        $(".checkout-steps-tablet-master .checkout-step-2").addClass("active");
                        $(".checkout-steps-tablet-master .checkout-step-3").addClass("active");

                        $(".checkout-steps-master .checkout-step-1").addClass("hideStep");
                        $(".checkout-steps-master .checkout-step-2").addClass("hideStep");
                        $(".checkout-steps-master .checkout-step-3").removeClass("hideStep");
                    } else {
                        $(".checkout-step-3 .overlay").addClass("hideOverlay");
                    }
                    break;
                default:
                    // Step 1 (Shipping Address)
                    $(".checkout-step-1").addClass("active");

                    $("#step-shipping-method").addClass("hideStep");

                    if(isInTabletMode) {
                        $(".checkout-steps-tablet-master .checkout-step-1").addClass("active");

                        $(".checkout-steps-master .checkout-step-1").removeClass("hideStep");
                        $(".checkout-steps-master .checkout-step-2").addClass("hideStep");
                        $(".checkout-steps-master .checkout-step-3").addClass("hideStep");
                    } else {
                        $(".checkout-step-1 .overlay").addClass("hideOverlay");
                    }
                    break;
            }

        }
    });

    $(document).ready(function () {

        if(pageContext.isTablet || pageContext.isMobile) {
            $(".checkout-steps-master > div").removeClass("col-xs-8 col-sm-8 col-md-8 col-lg-8");
            $(".checkout-steps-master > div").addClass("col-xs-24 col-sm-24 col-md-24 col-lg-24");
        } else if(pageContext.isDesktop) {
            console.log("Desktop");
        } else {
            console.log("Unable to detect Device. So Checkout is not visible.");
        }


        /* Angular does not use the AMD pattern, and needs to load these scripts in order */
        var angularPaths = {
            base : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js',
            animate : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-animate.min.js',
            aria : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-aria.min.js',
            material : 'https://ajax.googleapis.com/ajax/libs/angular_material/0.11.2/angular-material.min.js'
        };
        function loadAngularScript(path, callback) {
            $.ajax({
              url: path,
              dataType: "script",
              success: callback
            });
        }

        // making these available globally
        console.info('------------- checkout.js --------------');
        window.angularQueue = window.angularQueue || [];
        window.activateAngularMaterial = window.activateAngularMaterial || activateAngularMaterial;
        window.loadAngular = window.loadAngular || loadAngular;
        window.sortShippingMethods = sortShippingMethods;

        activateAngularMaterial(['step-shipping-address','newsletter-optin', 'billing-address', 'credit-card-payment', 'email-address']);

        function activateAngularMaterial(container) {
            console.warn('ACTIVATE ANGULAR MATERIAL',container);

          if (container && container.constructor == String && window.angularQueue.indexOf(container) === -1) {
            console.log('adding single element to queue:', container);
            window.angularQueue.push(container);
          }
          if (container && container.constructor == Array) {
            console.log('adding multiple elements to queue:', container);
            for (var j = 0, lent = container.length; j < lent; j+=1) {
              if (window.angularQueue.indexOf(container[j]) === -1) {
                console.log('...adding to queue:', container[j]);
                window.angularQueue.push(container[j]);
              }
            }
          }
          console.log('Updated queue:', window.angularQueue);

          if(window.angularLoading) {
            console.warn('*********************** angular is already loading, bailing on activateAngularMaterial() *****************');
            return;
          }
          if(!window.angularLoaded){
              window.angularLoading = true;
              loadAngular();
            return;
          }

          console.log('ACTUALLY running bootstrap on queued containers');

          for (var i = 0, len = window.angularQueue.length; i < len; i+=1) {
            //window.angularQueue.push(container[i]);
            bootstrapContainer(window.angularQueue[i]);
          }

            function bootstrapContainer(containerId) {
                var containerElement = document.getElementById(containerId);
                if (containerElement && ! containerElement.hasAttribute('ng-controller')) {
                    containerElement.setAttribute('ng-controller', 'FormController');
                    containerElement.className = containerElement.className.replace(/(^|\s)hide-loading(?!\S)/g ,''); // == removeClass('hide-loading')
                    window.angular.bootstrap(containerElement, ['MaterialFields']);
                }

            }
        }

        function loadAngular() {
            /* Angular does not use the AMD pattern, and needs to load these scripts in order */
            var angularPaths = {
              base : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js',
              animate : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-animate.min.js',
              aria : 'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-aria.min.js',
              material : 'https://ajax.googleapis.com/ajax/libs/angular_material/0.11.2/angular-material.min.js'
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
              console.info('end of the line: loadAngularMaterial()');
              window.angular.module('MaterialFields', ['ngMaterial'])
                .config(['$interpolateProvider', function($interpolateProvider) {
                  $interpolateProvider.startSymbol('[[').endSymbol(']]');
                }])
                .controller('FormController', ['$scope', function($scope) {

                  console.warn('FormController hello');

                  $scope.syncSelect = function(key, dummyFieldValue) {
                    if(key === 'ship-to-state') {
                      window.checkoutViews.steps.shippingAddress.model.attributes.address.attributes.stateOrProvince = dummyFieldValue;
                      return;
                    }
                    if(key === 'payment-card-month') {
                      window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.expireMonth = dummyFieldValue;
                      return;
                    }
                    if(key === 'payment-card-year') {
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
                        console.log('input',input);

                        // Update model
                        window.checkoutViews.steps.shippingInfo.model.attributes.currencyCode = input.data('currency');
                        window.checkoutViews.steps.shippingInfo.model.attributes.isValid = input.data('valid');
                        window.checkoutViews.steps.shippingInfo.model.attributes.price = input.data('price');
                        window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodCode = input.data('code');
                        window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodName = input.data('name');
                        window.checkoutViews.steps.shippingInfo.model.attributes.shippingZoneCode = input.data('zone');
                        console.log('model updated:',window.checkoutViews.steps.shippingInfo.model.attributes);
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
                        console.log('input',input);

                        // Update model
                        window.checkoutViews.steps.shippingInfo.model.attributes.currencyCode = input.data('currency');
                        window.checkoutViews.steps.shippingInfo.model.attributes.isValid = input.data('valid');
                        window.checkoutViews.steps.shippingInfo.model.attributes.price = input.data('price');
                        window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodCode = input.data('code');
                        window.checkoutViews.steps.shippingInfo.model.attributes.shippingMethodName = input.data('name');
                        window.checkoutViews.steps.shippingInfo.model.attributes.shippingZoneCode = input.data('zone');
                        console.log('model updated:',window.checkoutViews.steps.shippingInfo.model.attributes);
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
                    n = n.replace(' ','');
                    n = n.replace('-', '');
                    n = n.replace('(', '');
                    n = n.replace(')', '');
                    if(n.length === 0) {
                      return n;
                    }
                    if(n.length > 0 && n.length <= 3) {
                      return '('+n+')';
                    }
                    if(n.length > 3 && n.length <= 6) {
                      return '('+n.substring(0,3)+') ' + n.substring(3,n.length);
                    }
                    if(n.length > 6) {
                      return '('+n.substring(0,3)+') ' + n.substring(3,6) + '-' + n.substring(6, n.length);
                    }
                    return n;
                  };

                  $scope.cardType = 'clear';

                  $scope.syncCreditCardType = function(cardNumber) {
                      console.log('syncCreditCardType()');
                      var prefix,
                          len = cardNumber.length;
                      if(len >= 4) {
                          prefix = cardNumber.slice(0,4);
                          if(prefix === '6011') {
                              console.info('setting DISCOVER');
                              $scope.cardType = 'discover';
                              window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.paymentOrCardType = 'DISCOVER';
                              return;
                          }
                      }
                      if(len >= 2) {
                          prefix = cardNumber.slice(0,2);
                          if(prefix === '34' || prefix === '37') {
                              console.info('setting AMEX');
                              $scope.cardType = 'amex';
                              window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.paymentOrCardType = 'AMEX';
                              return;
                          }
                          if(prefix === '51' || prefix === '52' || prefix === '53' || prefix === '54' || prefix === '55') {
                              console.info('setting MC');
                              $scope.cardType = 'mastercard';
                              window.checkoutViews.steps.paymentInfo.model.attributes.card.attributes.paymentOrCardType = 'MC';
                              return;
                          }
                      }
                      if(len >= 1) {
                          prefix = cardNumber[0];
                          if(prefix === '4') {
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

                    cancelButton.className = cancelButton.className.replace(/(^|\s)ng-hide(?!\S)/g ,''); // == removeClass('ng-hide')
                    couponButton.className = couponButton.className.replace(/(^|\s)ng-hide(?!\S)/g ,''); // == removeClass('ng-hide')
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
                    field.parentNode.className = field.parentNode.className.replace(/(^|\s)md-input-has-value(?!\S)/g ,''); // == removeClass('md-input-has-value')
                    field.value = '';
                  };

                }]);

              window.angularLoaded = true;
              window.angularLoading = false;
              activateAngularMaterial();

            }
        }

        function sortShippingMethods() {
            var $listItems = $('#shipping-methods li'),
                $listParent = $('#shipping-methods ul');

          $listItems.sort(function(a,b){
            var an = parseFloat(a.getAttribute('data-cost')),
              bn = parseFloat(b.getAttribute('data-cost'));

            if(an > bn) {
              return 1;
            }
            if(an < bn) {
              return -1;
            }
            return 0;
          });

          $listItems.detach().appendTo($listParent);

        }


      //CreditCard Mask

        /** creditCardUtil.init("#mz-payment-credit-card-number");
        creditCardUtil.onValid(function (result) {
            console.log('Im Valid');
            console.log(result);
            console.log(creditCardUtil.isValid());
        });
        **/
        $('.checkout-form').removeClass("hidden");

        // Sudhir ==
        var checkoutStepModel = new CheckoutStepModel();
        checkoutStepModel.manipulateUI();

        var $checkoutView = $('.checkout-form'),
            checkoutData = require.mozuData('checkout');

        var checkoutModel = window.order = new CheckoutModels.CheckoutPage(checkoutData);

        // SUDHIR -------- COUPON CODE MANIPULATION VIA COOKIE
        var isCodeEntered = !!checkoutModel.get('couponCode');
        var couponCodeInCookie = $.cookie('promoCode');

        if (couponCodeInCookie && !this.isCodeEntered) {
            isCodeEntered = true;
        }
        if (!couponCodeInCookie && this.isCodeEntered) {
            isCodeEntered = false;
        }
        if (isCodeEntered) {
            checkoutModel.attributes.couponCode = ""+couponCodeInCookie;
            checkoutModel.set( {"couponCode": couponCodeInCookie} );

            console.log("ADDING Coupone code");
            checkoutModel.addCoupon().ensure(function() {
                console.log("Coupon code added");

                window.checkoutViews.reviewPanel.render();

                //checkoutModel.unset('couponCode');
            });
        }

        var checkoutViews = {
            steps: {
                shippingAddress: new ShippingAddressView({
                    el: $('#step-shipping-address'),
                    model: checkoutModel.get("fulfillmentInfo").get("fulfillmentContact")
                }),
                shippingInfo: new ShippingInfoView({
                    el: $('#step-shipping-method'),
                    model: checkoutModel.get('fulfillmentInfo')
                }),
                paymentInfo: new BillingInfoView({
                    el: $('#step-payment-info'),
                    model: checkoutModel.get('billingInfo')
                })
            },
            orderSummary: new OrderSummaryView({
                el: $('#order-summary'),
                model: checkoutModel
            }),
            couponCode: new CouponView({
                el: $('#coupon-code-field'),
                model: checkoutModel
            }),
            comments: Hypr.getThemeSetting('showCheckoutCommentsField') && new CommentsView({
                el: $('#comments-field'),
                model: checkoutModel
            }),

            reviewPanel: new ReviewOrderView({
                el: $('#step-review'),
                model: checkoutModel
            }),
            messageView: messageViewFactory({
                el: $checkoutView.find('[data-mz-message-bar]'),
                model: checkoutModel.messages
            })
        };

        window.checkoutViews = checkoutViews;

        checkoutModel.on('complete', function() {
            var str = "0";
            str = window.escape(str);
            var promoCd = "";
            promoCd = window.escape(promoCd);
            var expDate = new Date();
            expDate.setMonth(expDate.getMonth()-2);
            document.cookie = "currentStepIndex="+str+";expires="+expDate.toGMTString() + "; path=/";
            document.cookie = "promoCode="+promoCd+";expires="+expDate.toGMTString() + "; path=/";
            CartMonitor.setCount(0);
            window.location = "/checkout/" + checkoutModel.get('id') + "/confirmation";
        });

        var $reviewPanel = $('#step-review');
        checkoutModel.on('change:isReady',function (model, isReady) {
            if (isReady) {
                checkoutStepModel.setStepIndex(3);

                setTimeout(function () { window.scrollTo(0, $reviewPanel.offset().top); }, 750);
            }
        });

        _.invoke(checkoutViews.steps, 'initStepView');

        $( "body" ).on("checkoutStepChanged", function(event) {
            checkoutStepModel.setStepIndex(event.nextStep);
            if((pageContext.isTablet || pageContext.isMobile) && event.nextStep != 1) {
                $( "body" ).scrollTop(0);
            }
        });
    });
});
