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
		var _products = {};

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

    fetchData = function(callback){
      var url = buildUrl();
      return $.get(url, callback);
		},
    //Uses a list of product IDs to return a list of products
    //That can be turned into a ProductCollection, which our
    //Views know how to handle.


    parseProducts = function(data){
      var dataList = [];

      _.each(data.widgetResults, function(results){
        var displayName = results.displayName;
        var placeholderName = results.placeholderName;
        var productList = [];
        var editModeMessage = "";

        var productSlots = results.slotResults.filter(function(product){
          return product.url; //Prunes slotResults for incomplete entries
        });

        var productIdList = [];
        _.each(productSlots, function(prod, key){
            var attrs = [];
            _.each(prod.attrs, function(attr, key, list){
                attrs[attr.name] = attr.values[0];
            });
            attrs.rank = prod.rank;
            productIdList.push(attrs);
        });

        if (productIdList.length !== 0){

        } else {
          editModeMessage = "There were no products configured for that placeholder name.";
        }
        dataList.push({
          displayName: displayName,
          placeholderName: placeholderName,
          productList: productIdList,
          editModeMessage: editModeMessage
        });

      });
      return dataList;
    };

		return {
			getProductData: function(callback){
        if(getProducts().length > 0){
          callback(getProducts());
        } else {
          fetchData(function(data){
            setProducts(parseProducts(data));
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
