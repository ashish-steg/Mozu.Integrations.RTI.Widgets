
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
    'shim!vendor/jquery/owl.carousel.min'
],
function($, Hypr, HyprLiveContext, _, api,Backbone, ProductModels, CartModels, CartMonitor) {

 var placeholder = require.mozuData("placeholder");
 var url = require.mozuData("productsUrl");
 if (placeholder){
   var rtiDiv = $('.'+placeholder);




 } else {
   alert("No placeholder set!");
 }

});
