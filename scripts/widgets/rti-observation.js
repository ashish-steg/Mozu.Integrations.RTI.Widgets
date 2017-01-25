require([
    'modules/jquery-mozu',
    "hyprlivecontext",
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'modules/models-product',
    'modules/models-cart',
    'modules/cart-monitor',
    'shim!vendor/jquery/owl.carousel.min'
],
function($, HyprLiveContext, _, api,Backbone, ProductModels, CartModels, CartMonitor) {
  var context = require.mozuData('pagecontext');
    //Set other variables needed by script

    //User ID:
    var bnExtUserId = require.mozuData('user').userId;

    //Search term on search pages:
    var bn_SearchTerm;
    if(context.pageType == "searchresult" || context.pageType == "search"){
      bn_SearchTerm = context.search.query;
    }

    //On order confirmation pages:
    var bnOrderId;
    var bnOrderTotal;
    var bnOrderDetails;

    if (context.pageType == "confirmation") {
      var order = require.mozuData('order');
      bnOrderId = order.orderNumber;
      bnOrderTotal = order.total;
      bnOrderDetails = [];

      for (var i = 0; i<order.items.length; i++){
        var item = order.items[i];
        var id = item.id;
        var quantity = item.quantity;
        var price = item.product.price.price;
        var detailString = id + ":" + quantity + ":" + price;
        bnOrderDetails.push(detailString);
      }
    }


});
