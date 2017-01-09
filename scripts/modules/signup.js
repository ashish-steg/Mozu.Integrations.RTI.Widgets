define([
  'modules/jquery-mozu', 'modules/api', 'hyprlive', 'underscore', 'modules/models-cart'
], function($, api, Hypr, _, CartModels) {
  
    var CreateAccountInstance = {
        show: function() {
     
            this.view.$el.addClass('is-active');
            var self = this;
            // dismisser method so that a click away will hide the softcart
            var clickAway = function(e) {
                if (self.view.el !== e.target && !$.contains(self.view.el, e.target)) {
                    self.view.$el.removeClass('is-active');
                    $(document.body).off('click', clickAway);
                }
            };
          $(document.body).on('click', clickAway);
        }
    };
    var SignupForm = function($el) {
        var self = this;
        this.$el = $el;
        this.$messageBar = this.$el.find('[data-mz-messagebar-container]');
        
        this.$el.find(".soft-cart-create-account-btn").on('click', function(e) {
          e.preventDefault();
          //new signup($el);
          self.signup();
        });
       /* this.$el.on('submit', function(e) {
          e.preventDefault();
          //new signup($el);
          self.signup();
        });*/
    };

    $.extend(SignupForm.prototype, {

        signup: function() {
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
                //var user = api.createSync('user', payload);
                return api
                .action('customer', 'createStorefront', payload)
                .then(function() {
                // window.location.reload();
                $("#cartform").submit();
                }, function(data){
                    if(data.message == 'Missing or invalid parameter: EmailAddress EmailAddress already associated with a login')
                    {
						var dspMsg = self.displayMessage(Hypr.getLabel('emailAlreadyExit'), false);
                    }
                    if(data.message == "Missing or invalid parameter: password Password must be a minimum of 6 characters with at least 1 number and 1 alphabetic character") {
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
            //if (data.password !== data.confirmpassword) return this.displayMessage(Hypr.getLabel('passwordsDoNotMatch')), false;
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
        api.action('cart')
		.then(function(cartData) {
		// window.location.reload();
		$("#cartModelId").attr("value",cartData.data.id);
			//console.log("cartdata   "+ $("#cartModelId").attr("value"));
		}, function(data){
			console.log(this.displayMessage);
		});
        var cartModel =  new CartModels.Cart();
        var $theForm = $('[data-mz-signup-form]');
        window.signupForm = new SignupForm($theForm);
        $theForm.noFlickerFadeIn();
        $(".soft-cart-continue-guest-btn").on('click',function(){
            $("#cartform").submit();
        });
    });

});




