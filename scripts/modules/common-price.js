require(["modules/jquery-mozu", "hyprlive", "modules/backbone-mozu"], function ($, Hypr, Backbone) {
    
    var PriceView = Backbone.View.extend({
        el: 'body',
        initialize: function() {
            this.priceFunction();
            this.render();
        },
        priceFunction: function() {
            $('.mz-price.is-crossedout').each(function() {
                var amountText = $(this).data("total-amount");
                var amountString = amountText.toString();
                var amountDollar = amountString.charAt(0);
                var totalp = amountString.split(amountDollar);
                $(this).html('<span class="dollar">'+amountDollar+'</span>'+totalp[1]);
            });
        
            $('.mz-price.is-saleprice').each(function() {
                var amountText = $(this).data("total-amount");
                var amountString = amountText.toString();
                var amountDollar = amountString.charAt(0);
                var totalp = amountString.split(amountDollar);
                $(this).html('<span class="dollar">'+amountDollar+'</span>'+totalp[1]);
            });
        },
        render: function() {
            this.priceFunction();
        }
    });
    $(document).ready(function () { 
        var priceview = new PriceView();
    });
});



