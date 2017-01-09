define([
  'modules/jquery-mozu', 'modules/api', 'hyprlive', 'underscore'
], function($, api, Hypr, _) {

    var SignupForm = function($el) {
        var self = this;
        this.$el = $el;
        this.type = $el.data('mz-type');
        this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
        this.$el.on('submit', function(e) {
            e.preventDefault();
            //new signup($el);
            self.signup(false);
        });

        // making these available globally
        console.info('------------- sign-up.js --------------');
        window.angularQueue = window.angularQueue || [];
        window.activateAngularMaterial = window.activateAngularMaterial || activateAngularMaterial;
        window.loadAngular = window.loadAngular || loadAngular;

        activateAngularMaterial(['sign-up-container']);

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
                window.angular.module('MaterialFields', ['ngMaterial'])
                    .config(['$interpolateProvider', function($interpolateProvider) {
                        $interpolateProvider.startSymbol('[[').endSymbol(']]');
                    }])
                    .controller('FormController', ['$scope', function($scope) {
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

    };

    $.extend(SignupForm.prototype, {

    signup: function(checkout) {
      var self = this,
        data = (function(formdata) {
          return _.object(_.pluck(formdata, 'name'), _.pluck(formdata, 'value'));
        }(this.$el.serializeArray())),
        payload = {
          account: {
            emailAddress: data.emailaddress,
            userName: data.emailaddress,
            firstName: data.firstname,
            lastName: data.lastname,
            contacts: [{
              email: data.emailaddress,
              firstName: data.firstname,
              lastNameOrSurname: data.lastname
            }]
          },
          password: data.password
        };

      if (this.validate(data)) {
        $("#sign-up-spinner").addClass('active');
        //var user = api.createSync('user', payload);
        return api
          .action('customer', 'createStorefront', payload)
          .then(function() {
            // window.location.reload();
             $("#sign-up-spinner").removeClass('active');
            if(self.type === "checkout") {
              document.getElementById('step1').style.display = 'none';
              document.getElementById('step2').style.display = 'block';
              return;
            }
            window.location = '/myaccount';
          }, function (data) {
              if (data.message == 'Missing or invalid parameter: EmailAddress EmailAddress already associated with a login')
                  return self.displayMessage(Hypr.getLabel('emailAlreadyExit')), false;
              if (data.message == "Missing or invalid parameter: password Password must be a minimum of 6 characters with at least 1 number and 1 alphabetic character") {
                  var dsppass = self.displayMessage('Password must be a minimum of 6 characters with at least 1 number and 1 alphabetic character', false);
              }
          });
      }
    },
    validate: function(data) {
        if (!data.emailaddress) return this.displayMessage(Hypr.getLabel('emailMissing')), false;
        if (!data.firstname) return this.displayMessage(Hypr.getLabel('firstNameMissing')), false;
        if (!data.lastname) return this.displayMessage(Hypr.getLabel('lastNameMissing')), false;
        if (!data.password) return this.displayMessage(Hypr.getLabel('passwordMissing')), false;
      return true;
    },
    displayMessage: function(msg) {
      this.$messageBar.html(this.messageTemplate.render({
        model: [
          {
            message: msg
          }
        ]
      }));
    },
    hideMessage: function() {
      this.$messageBar.html('');
    },
    messageTemplate: Hypr.getTemplate('modules/common/message-bar')
  });

  $(document).ready(function() {
    var $theForm = $('[data-mz-signup-form]');
    window.signupForm = new SignupForm($theForm);
    $theForm.noFlickerFadeIn();
  });
  window.onload = function() {
      document.getElementById("firstname").focus();
  };

});


