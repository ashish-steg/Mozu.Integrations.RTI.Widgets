define([
    'modules/jquery-mozu',
    'hyprlive',
    "hyprlivecontext",
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'modules/models-product'
],
function($, Hypr, HyprLiveContext, _, api,Backbone, ProductModels) {
  var instance;

	var init = function(options) {

		var _options = options;
		var _products = [];

    var getRTIOptions = function(){
      return _options;
    },
    getProducts = function(){
      return _products;
    },

    setRTIOptions = function(options){
      _options = options;
    },
    setProducts = function(products){
      _products = products;
    },
    getCookie = function(cname){
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
    },
		buildUrl = function(){
      var firstPart = '//' + getRTIOptions().customerId + '-' + getRTIOptions().customerCode + '.baynote.net/recs/1/' + getRTIOptions().customerId + '_' + getRTIOptions().customerCode + '?',
      requiredParams = '&attrs=Price&attrs=ProductId&attrs=ThumbUrl&attrs=Title&attrs=url';

      var userIdQuery = "&userId=" + getCookie('bn_u'),
      bnExtUserIdQuery = "&User.bnExtUserId=" + require.mozuData('user').userId;


      var source = window.location.href;
      if (source.startsWith("http://")){
        source = "https://" + source.slice(7);
      }
      var sourceQuery = "&source="+source;


      var tenantIdQuery = "&tenantId=";
      var siteIdQuery = "&siteId=";

      if (getRTIOptions().includeTenantId){
        tenantIdQuery += require.mozuData('sitecontext').tenantId;
      }
      if (getRTIOptions().includeSiteId){
        siteIdQuery += require.mozuData('sitecontext').siteId;
      }

      //The queries stored in pageDependentSection vary between page types
      //Right now the only difference configured is thatif pageType is cart,
      //We add productIds to the query.

      var pageDependentSection = "";
      if (getRTIOptions().pageType=="Home"){

      } else if (getRTIOptions().pageType=="ProductDetail") {

      } else if (getRTIOptions().pageType=="Cart"){
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

      //if the user has entered anything in the js injection box...
      if (getRTIOptions().jsInject){
        //We'll attempt to run it
        try {
          eval(getRTIOptions().jsInject); // jshint ignore:line
        } catch(e) {
          console.log("There was a problem with your javascript injection.");
          console.log(e);
        }
      } else {
        inject = "&query=&Override=&Product.Override=";
      }


      var url = firstPart +
       requiredParams +
        userIdQuery +
         bnExtUserIdQuery +
           sourceQuery + //Current page URL
            pageDependentSection +
             tenantIdQuery + //From checkbox
              siteIdQuery + //From checkbox
               inject + //From javascript field in config editor
               "&format=json";

        return url;


		},

    fetchProducts = function(callback){
      var url = buildUrl();
      return $.get(url, callback);
		};


		return {
			getData: function(callback){
        if(getProducts().length > 0){
          callback(getProducts());
        } else {
          fetchProducts(function(data){
            setProducts(data);
            callback(getProducts());
          });
        }

			}
		};

	};

	return {
		getInstance: function(options) {
			if (!instance){
				instance = init(options);
			}
			return instance;
		}
	};

});
