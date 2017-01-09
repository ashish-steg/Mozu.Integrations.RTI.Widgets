define(['modules/backbone-mozu', 'hyprlive', 'hyprlivecontext',
'modules/jquery-mozu', 'underscore',
'modules/models-customer', 'modules/views-paging',
'modules/api', 'modules/models-product',
'modules/models-cart', 'modules/cart-monitor',"modules/soft-cart"],
function(Backbone, Hypr, HyprLiveContext, $, _, CustomerModels, PagingViews, api, ProductModels, CartModels, CartMonitor, SoftCart) {
    var user = require.mozuData('user');
    var wishCount;
    
    var ProductModelColor = Backbone.MozuModel.extend({
        mozuType: 'products'
    });
    
    var EditableView = Backbone.MozuView.extend({
        constructor: function () {
            Backbone.MozuView.apply(this, arguments);
            this.editing = {};
        },
        getRenderContext: function () {
            var c = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            c.editing = this.editing;
            return c;
        },
        doModelAction: function (action, payload) {
            var self = this,
                renderAlways = function () {
                    self.render();
                };
            var operation = this.model[action](payload);
            if (operation && operation.then) {
                operation.then(renderAlways,renderAlways);
                return operation;
            }
        }
    });
    
    var WishListView = EditableView.extend({
        
        templateName: 'modules/my-wishlist',
        initialize: function () {
          //  this.model.set('hasItems', this.model && this.model.apiModel.data.items.length > 0);
            this.editing = {};
            this.update();
        },
        doNotRemove: function() {
            this.editing.added = false;
            this.editing.remove = false;
            this.render();
        },
        update: function() {
            // populate the cart model asynchronously from the api
            /*this.model.clear();
            this.model.unset('items');
            this.model.attributes = {};
            this.model.apiModel.data = {};
            this.model.set('mozuType', 'wishlist');
             
            return this.model.update();*/
            
            var self = this;
            return api.createSync('wishlist').getOrCreate(user.accountId).then(function(list) {
                window.wishlist = list;
                window.wishlistItems = list.data.items;
                
                wishCount = list.data.items.length;
                self.model.set('items', window.wishlistItems);
                self.render();
                if(wishCount === 0) {
                    $('.wishlistcount').hide();
                } else {
                    $('.wishlistcount').show();
                }
                $('.mz-wishlistmonitor').text(wishCount);
            }); 
        },
        clickClose: function() {
            $('.mask').fadeOut();
            $('#page-wrapper').removeClass('cartOpen');
            $(".wishlist-wrap").removeClass('is-active');
            $('body').animate({
                scrollTop: 0
            }, 400);
            this.update();
        },
        colorImage: function() {
            var productCodeArray = [];
            var swatchColArray = [];
            var mainImage;
            var selfArray = [];
            var mainImageArray = [];
            $('.wish-list-item').each(function() {
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
            _.each(productCodeArray, function(productCode, index1){
                var productCodeFilter = 'productCode eq ';
                productCodeFilter += productCode+ ' or ';
                filterString.push(productCodeFilter);
            });
            var string = filterString.toString().replace(/,/g, '');
            var string1 = string.replace(/"/g, '');
            var finalFilter = string1.substring(0, string1.length - 4);
            //console.log(finalFilter);
            CurrentProductModel.set('filter', finalFilter);
            CurrentProductModel.fetch().then(function(responseObject) {
                var prodContent = responseObject.apiModel.data.items;
                var prodImg = null, prodImgAltText = null, ImgAltText = null;
                _.each(productCodeArray, function(productCode1, index){
                    var flag = 0;
                    _.each(prodContent, function(pCode, index2) {
                        if(productCode1 === pCode.productCode) {
                            for(var i=0; i < productCodeArray.length; i++) {
                            var prodImgs = pCode.content.productImages;
                                for(var j=0; j < prodImgs.length; j++) {
                                    var productAtlText = pCode.content.productImages[j].altText;
                                    if (productAtlText) {
                                        prodImgAltText = productAtlText.toLowerCase();
                                        if (prodImgAltText === swatchColArray[index]) {
                                            prodImg = pCode.content.productImages[j].imageUrl;
                                            var productATLText = pCode.content.productImages[j].altText;
                                            if(flag === 0) {
                                                selfArray[index].find('.wish-list-item-image').attr({"src": prodImg+"?max=200", "style":"max-width: 80%;"});
                                                flag++;
                                            }
                                        } else if(flag === 0) {
                                            selfArray[index].find('.wish-list-item-image').attr({"src": mainImageArray[index]+"?max=200", "style":"max-width: 80%;"});
                                        }
                                    }  else if (productAtlText !== swatchColArray[index] && flag === 0) {
                                        selfArray[index].find('.wish-list-item-image').attr({"src": mainImageArray[index]+"?max=200", "style":"max-width: 80%;"});
                                    }
                                }
                            }
                        }
                    });  
                });
            });
        },
        show: function() {
            this.$el.addClass('is-active');
                //open slide mybag 
            if (this.$el.addClass('is-active')) {
                $('.mask').fadeIn();
                $('#page-wrapper').addClass('cartOpen');
                $('body').delay(1300).animate({
                    scrollTop: 0
                }, 500);
            }
            var self = this;
            // dismisser method so that a click away will hide the softcart
            $('.mask').on('click',function(e) {
                self.$el.removeClass('is-active');
                $('#page-wrapper').removeClass('cartOpen');
                $('body').animate({
                    scrollTop: 0
                }, 400);
                self.update();
            });
        },
        beginRemoveItem: function (e) {
            var self = this;
            var id = $(e.currentTarget).data('mzItemId');
            if (id) {
                this.editing.remove = id;
                this.render();
            }
        },
        finishRemoveItem: function(e) {
            var self = this;
            var id = $(e.currentTarget).data('mzItemId');
            if (id) {
                var removeWishId = id;
                
                window.wishlist.deleteItem(removeWishId).then(function () {
                    self.editing.remove = false;
                    var itemToRemove = self.model.get('items').where({ id: removeWishId });
                    if (itemToRemove) {
                        self.model.get('items').remove(itemToRemove); 
                        self.render();
                        $(document).trigger("removeFilledHeart");
                    }
                });
            }
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
        render: function () {
            var self = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);
            this.colorImage();
        },
        messageTemplate: Hypr.getTemplate('modules/common/message-bar')
    });

    var WishlistItem = Backbone.MozuModel.extend({ 
        relations: {
            product: ProductModels.Product
        }
    });
    
    var Wishlist = Backbone.MozuModel.extend({
        mozuType: 'wishlist',
        helpers: ['hasItems'],
        hasItems: function() {
            return this.get('items').length > 0;
        },
        update: function() {
            return this.get('items');
        },
        relations: {
            items: Backbone.Collection.extend({
                model: WishlistItem
            })
        },
        addItemToCart: function (id) {
            var self = this;
            return this.apiAddItemToCartById(id).then(function (item) {
                self.trigger('addedtocart', item, id);
                return item;
            });
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
    
    $(document).ready(function () {
        
        if(user.isAnonymous && !user.isAthenticated) {
            /*console.log("Anonymous user");*/
        } else {
            api.createSync('wishlist').getOrCreate(user.accountId).then(function(list) {
                // list.data.items will contain the wishlist items
                var wishlistModel = new Wishlist( { items : list.data.items } );
                window.wishlist = list;
                window.wishlistItems = list.data.items;
                //console.log(api.getAvailableActionsFor('wishlist'));
                wishCount = list.data.items.length;
                
                var wishlistView = new WishListView({
                    el: $('[data-mz-role="wishList"]'),
                    model: wishlistModel
                });
                $(document).on('click', '#myWishlist', function(e) {
                    e.preventDefault();
                    wishlistView.update().then(function() {
                        wishlistView.show();
                    });
                });
                
                if(wishCount === 0) {
                    $('.wishlistcount').hide();
                } else {
                    $('.wishlistcount').show();
                }
                $('.mz-wishlistmonitor').text(wishCount);
                
                window.wv = wishlistView;
                wishlistView.render();
                
                $(document).on('productAddedToWishlist', function(e, data) {
                    wishlistView.update().then(function() {
                        wishlistView.show();
                    });
                });
            });
        }
    });
});