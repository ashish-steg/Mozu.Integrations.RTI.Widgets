define(['modules/backbone-mozu', 
        'underscore', 
        'modules/jquery-mozu', 
        'modules/api', 
        'hyprlive', 
        'underscore',
        'shim'
		],
        
        function (Backbone, _, $, api, Hypr) {

        var ForgotPasswordView = Backbone.View.extend({
            events: {
                "click [data-mz-action='submitforgotpassword']": "submitforgotpassword",
                "click [data-mz-action='backToLogin']": "backToLogin"
            },
            submitforgotpassword: function () {
                api.action('customer', 'resetPasswordStorefront', {
                    EmailAddress: $('[data-mz-forgotpassword-email]').val()
                }).then(this.displayResetPasswordMessage, this.displayApiMessage);
            },
            backToLogin: function() {
                $('[data-mz-forgot-pass-panel]').hide();
                $('[data-mz-signin-panel]').show();
            },
            displayResetPasswordMessage: function () {
                $('.forgot-password-panel .success-msg').html('<span class="success-msg">' + Hypr.getLabel('resetEmailSent') + '</span>');
                setTimeout(function() {
                    $('[data-mz-forgot-pass-panel]').hide();
                    $('[data-mz-signin-panel]').show();
                    }, 2000);
            },
            displayApiMessage: function (xhr) {
                $('.forgot-password-panel .error-msg').html('<span class="error-msg">' + (xhr.message ||
                    (xhr && xhr.responseJSON && xhr.responseJSON.message) ||
                    Hypr.getLabel('unexpectedError')) + '</span>');
            }
        });

        $(document).ready(function () {
            var forgotPasswordView = new ForgotPasswordView({el: $('[data-mz-forgot-pass-panel]')});
            
            $("[data-forgotpassword-link]").on("click", function(e) {
                e.preventDefault();
                $('.forgot-password-panel .success-msg').html("");
                $('.forgot-password-panel .error-msg').html("");
                $('[data-mz-signin-panel]').hide();
                $('[data-mz-forgot-pass-panel]').show();
                $('html, body').animate({
                scrollTop: 0
            }, 100);
			return false;
		});
    });
});






