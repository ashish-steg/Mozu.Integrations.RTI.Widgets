define([
    'modules/jquery-mozu',
    'underscore',
    'modules/backbone-mozu',
    'hyprlivecontext',
    'modules/views-collections',
    'modules/models-product',
    'modules/models-cart',
    'modules/views-productimages',
    'modules/api',
    'shim!vendor/jquery/jquery-ui.min',
    'shim!vendor/jquery/jquery-ui-touch-punch.min'
], function($, _, Backbone, Hypr, ProductModels, ProductImageViews, api) {

    var lowPrice = [];
    var maxPrice = null;
    var minPrice = null;
    window.priceRangeStart = null;
    window.priceRangeEnd = null;
    window.priceSlider = false;

    var ProductModel = Backbone.MozuModel.extend({
        mozuType: 'search'
    });
    var currentOpenFacetViewID;

    var ProductListView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-list-tiled'
    }),

    FacetingPanel = Backbone.MozuView.extend({
        additionalEvents: {
            "change [data-mz-facet-value]": "setFacetValue"
        },
        templateName: "modules/product/faceting-form",
        initialize: function() {
            this.listenTo(this.model, 'loadingchange', function(isLoading) {
                this.$el.find('input').prop('disabled', isLoading);
            });
            
            this.radiobuttn();
            this.priceFunction();
            this.priceRangeSlider();
            this.colorSelected();
            var me = this;
            if (!this.model._isPaged) {
                throw "Cannot bind a Paging view to a model that does not have the Paging mixin!";
            }
            /*handle browser's back button to make sure startIndex is updated.*/
            Backbone.history.on('route', function() {
                me.model.syncIndex(Backbone.history.fragment);
            });
        },
        getRenderContext: function() {
            var c = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            currentOpenFacetViewID = $('.panel').find('.panel-collapse.in').attr('id');
            return c;
        },
        render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);
            this.productGridListView();
            this.$('select').each(function() {
                var $this = $(this);
                $this.val($this.find('option[selected]').val());
            });
            this.colorSelected();
            this.radiobuttn();
            this.priceFunction();
            this.priceRangeSlider();
            $('.' + currentOpenFacetViewID).trigger('click');
        },
        productGridListView: function() {
            if ($('[data-mz-product-list-view]').hasClass('active')) {
                $(document).find('.mz-productlist-item, .mz-productlisting').addClass('list');
                $(document).find('.mz-productlist-item, .mz-productlisting').removeClass('grid');
                $(document).find('[data-mz-product-list-view]').find('#Product-Grid').children().css('fill', '#4A4A4A');
                $(document).find('[data-mz-product-grid-view]').find('#Product-Grid').children().css('fill', '#ECEDF1');
            }
            if ($('[data-mz-product-grid-view]').hasClass('active')) {
                $(document).find('.mz-productlist-item, .mz-productlisting').addClass('grid');
                $(document).find('.mz-productlist-item, .mz-productlisting').removeClass('list');
                $(document).find('[data-mz-product-grid-view]').find('#Product-Grid').children().css('fill', '#4A4A4A');
                $(document).find('[data-mz-product-list-view]').find('#Product-Grid').children().css('fill', '#ECEDF1');
            }
        },
        priceRangeSlider: function(event) {
            var self = this;

            var catIDArray = [];
            $('[data-mz-facet="categoryId"]' || '[data-mz-facet="CategoryId"]').each(function() {
                var drillDownCat = $(this).data('mz-hierarchy-id');
                catIDArray.push(drillDownCat);
            });
            var catstring = [];
            _.each(catIDArray, function(catIDSingle) {
                var stringCat = " or categoryId eq " + catIDSingle;
                catstring.push(stringCat);
            });
            var categoryIDFilterString = catstring.toString().replace(/,/g, '');

            var url = window.location.href;

            /*sortBy=price%20asc&categoryId=53*/
            var sortbyLessPrice = "price asc",
                sortbyHighPrice = "price desc";

            if (sortbyLessPrice) {
                var ProdModels = new ProductModel();
                if (url.search('search') > 0) {
                    var splitStr;
                    if (url.search('query=') > 0) {
                        splitStr = url.split("query=");
                        var splitQ = splitStr[1].split("&");
                        var queryStr = splitQ[0].toString();
                        if (categoryIDFilterString) {
                            ProdModels.set('query', queryStr);
                            ProdModels.set('filter', categoryIDFilterString.toString().substr(4));
                        } else {
                            ProdModels.set('query', queryStr);
                        }
                    }
                } else {
                    var categoryId = $('[data-mz-category]').data('mz-category');
                    if (categoryIDFilterString && categoryId) {
                        ProdModels.set('filter', 'categoryId eq ' + categoryId + categoryIDFilterString);
                    } else if (categoryId) {
                        ProdModels.set('filter', 'categoryId eq ' + categoryId);
                    }
                }
                ProdModels.set('sortBy', sortbyLessPrice);
                ProdModels.set('startIndex', 0);
                ProdModels.set('pageSize', 1);
                ProdModels.set('totalCount', 1);
                ProdModels.fetch().then(function(responseObject) {
                    var prodContent = responseObject.get("items");
                    for (var i = 0; i < prodContent.length; i++) {
                        var price = prodContent[i].price.price;
                        var salePrice = prodContent[i].price.salePrice;
                        if (salePrice) {
                            lowPrice.push(price);
                            lowPrice.push(salePrice);
                            minPrice = _.min(lowPrice);
                        } else {
                            minPrice = price;
                        }
                    }
                });
            }

            if (sortbyHighPrice) {
                var CurrentProductModel = new ProductModel();
                if (url.search('search') > 0) {
                    var splitStrr;
                    if (url.search('query=') > 0) {
                        splitStrr = url.split("query=");
                        var splitQr = splitStrr[1].split("&");
                        var queryStrr = splitQr[0].toString();
                        if (categoryIDFilterString) {
                            CurrentProductModel.set('query', queryStrr);
                            CurrentProductModel.set('filter', categoryIDFilterString.toString().substr(4));
                        } else {
                            CurrentProductModel.set('query', queryStrr);
                        }
                    }
                } else {
                    var categoryIdr = $('[data-mz-category]').data('mz-category');
                    if (categoryIDFilterString && categoryIdr) {
                        CurrentProductModel.set('filter', 'categoryId eq ' + categoryIdr + categoryIDFilterString);
                    } else if (categoryIdr) {
                        CurrentProductModel.set('filter', 'categoryId eq ' + categoryIdr);
                    }
                }
                CurrentProductModel.set('sortBy', "price desc");
                CurrentProductModel.set('startIndex', 0);
                CurrentProductModel.set('pageSize', 1);
                CurrentProductModel.set('totalCount', 1);
                /*console.log(CurrentProductModel);*/
                CurrentProductModel.fetch().then(function(responseObject) {
                    var prodContent = responseObject.get("items");
                    for (var i = 0; i < prodContent.length; i++) {
                        var price = prodContent[i].price.price;
                        var salePrice = prodContent[i].price.salePrice;
                        if (salePrice) {
                            lowPrice.push(price);
                            lowPrice.push(salePrice);
                            if (prodContent[i].price.catalogListPrice) {
                                lowPrice.push(prodContent[i].price.catalogListPrice);
                            }
                            maxPrice = _.max(lowPrice);
                        } else {
                            maxPrice = price+5 || prodContent[i].price.catalogListPrice+5;
                        }
                        /*console.log(maxPrice+" && "+minPrice);*/
                        if (maxPrice && minPrice) {
                            $(".price-slider").removeClass("hidden");
                            self.priceSlider();
                        } 
                        else {
                            self.priceRangeSlider();
                            /*console.log("Error : Price Slider Max or Min value is null. Max Price = "+maxPrice+ ", Min Price = "+minPrice);*/
                        }
                    }
                });
            }

            /*slider styling */
            this.$el.find(".price-slider-range").css({
                'height': '1px',
                'background': '#979797',
                'margin': '1rem auto 2rem',
                'border': 0,
                'border-radius': 0,
                'width': '85%',
                'transition': 'all 0.3s ease-in-out',
                'font-family': 'Roboto,sans-serif'
            });
            this.$el.find(".price-slider-range").find('.ui-widget-header').css({
                'background': '#979797',
                'width': 'auto'
            });
        },
        priceSlider: function(event) {
            var self = this;
            var sortByChanged = false;
            var localPriceStart = null;
            var localPriceEnd = null;
            this.$el.find(".price-slider-range").slider({
                range: true,
                animate: true,
                min: minPrice,
                max: maxPrice,
                values: [minPrice, maxPrice],
                step: 1,
                slide: function(event, ui) {
                    localPriceStart = ui.values[0].toString();
                    localPriceEnd = ui.values[1].toString();
                    $(".min-price").html('<span class="dollar">$</span><span id="min-amount">' + localPriceStart + '</span>');
                    $(".max-price").html('<span class="dollar">$</span><span id="max-amount">' + localPriceEnd + '</span>');
                },
                stop: function(values) {
                    window.priceRangeStart = localPriceStart;
                    window.priceRangeEnd = localPriceEnd;
                    window.priceSlider = true;
                    var url = window.location.href;
                    if (url.search('search') > 0) { 
                        Backbone.trigger(window.productViewListGrid.onScrollProductLoading(window.priceRangeStart, window.priceRangeEnd, window.priceSlider));
                    } else {
                        Backbone.trigger(window.categoryProductView.onScrollProductLoading(window.priceRangeStart, window.priceRangeEnd, window.priceSlider));
                    }
                    if (maxPrice > localPriceEnd) {
                        $('.max-price').addClass('hover-effect');
                        $('.max-price').closest('span.ui-slider-handle').addClass('uiSliderHandle');
                    } else {
                        $('.max-price').removeClass('hover-effect');
                        $('.max-price').closest('span.ui-slider-handle').removeClass('uiSliderHandle');
                    }
                    if (minPrice < localPriceStart) {
                        $('.min-price').addClass('hover-effect');
                        $('.min-price').closest('span.ui-slider-handle').addClass('uiSliderHandle');
                    } else {
                        $('.min-price').removeClass('hover-effect');
                        $('.min-price').closest('span.ui-slider-handle').removeClass('uiSliderHandle');
                    }
                }
            }).draggable();
            
            self.$el.find('.ui-slider-handle').first('span').html('<span class="min-price"></span>');
            self.$el.find('.ui-slider-handle').last('span').html('<span class="max-price"></span>');
            $('.min-price').css({
                'left': '0',
                'bottom': '2rem'
            });
            $('.max-price').css({
                'left': '-1.5rem',
                'top': '1rem'
            });
            $('.min-price, .max-price').css({
                'position': 'relative',
                'color': '#4a4a4a',
                'font-size': '1rem'
            });
            $('.min-price, .max-price').on({
                mouseenter: function() {
                    $(this).css({
                        'font-size': '1.12rem',
                        'font-weight': '500'
                    });
                },
                mouseleave: function() {
                    $(this).css({
                        'font-size': '1rem',
                        'font-weight': '300'
                    });
                }
            });
            $(".min-price").html('<span class="dollar">$</span>' + $(".price-slider-range").slider("values", 0));
            $(".max-price").html('<span class="dollar">$</span>' + $(".price-slider-range").slider("values", 1));
            self.$el.find('.price-slider .ui-slider-handle').css({
                'width': '9px',
                'height': '9px',
                'border': '1px solid #979797',
                'background': 'transparent',
                'border-radius': '100%'
            });
            self.$el.find('.ui-slider-handle').on({
                mouseenter: function() {
                    $(this).css({
                        'width': '13px',
                        'height': '13px',
                        'border': '1px solid #4a4a4a',
                        'background': '#4a4a4a',
                        'border-radius': '100%'
                    });
                    $(this).children('span').css({
                        'font-size': '1.12rem',
                        'font-weight': '500'
                    });
                },
                mouseleave: function() {
                    $(this).css({
                        'width': '9px',
                        'height': '9px',
                        'border': '1px solid #979797',
                        'background': 'transparent',
                        'border-radius': '100%'
                    });
                    $(this).children('span').css({
                        'font-size': '1rem',
                        'font-weight': '300'
                    });
                }
            });
        },
        priceFunction: function() {
            $('.mz-price').each(function() {
                var amountText = $(this).data("total-amount");
                var amountString = amountText.toString();
                var amountDollar = amountString.charAt(0);
                var totalp = amountString.split(amountDollar);
                $(this).html('<span class="dollar">' + amountDollar + '</span>' + totalp[1]);
            });
        },
        colorSelected: function() {
            var self = this;
            var productList = $('.mz-productlist-item');
            $(productList).each(function() {
                var me = this,
                    mainImageAltTextArray = [],
                    productoptionsColors = [],
                    mainImgaltText;
                var altText = $(this).find("[data-main-image-src]").attr("alt");
                if (altText) {
                    mainImgaltText = altText.toString().toLowerCase();
                }
                $(this).find('[data-mz-swatch]').each(function() {
                    var colorOption = $(this).val();
                    if (colorOption) {
                        var clr = colorOption.toString().toLowerCase();
                        productoptionsColors.push(clr);
                    }
                });
                _.each(productoptionsColors, function(colors) {
                    if (mainImgaltText === colors) {
                        $(me).find('[data-mz-swatch]').each(function() {
                            var border = this;
                            if ($(this).hasClass(mainImgaltText)) {
                                $(border).css({
                                    'border': '2px solid #4a4a4a'
                                });
                            }
                        });
                    }
                });
            });
        },
        clearFacets: function() {
            this.model.clearAllFacets();
        },
        clearFacet: function(e) {
            this.model.get("facets").findWhere({
                field: $(e.currentTarget).data('mz-facet')
            }).empty();
        },
        updateSortBy: function(e) {
            e.preventDefault();
            return this.model.sortBy($(e.currentTarget).val());
        },
        radiobuttn: function() {
            var self = this;
            $('.panel-body .mz-pagingcontrols-pagesort-dropdown').each(function(selectIndex, selectElement) {
                $(selectElement).hide();
                var select = $(selectElement);
                var container = $("<div class='radioSelectContainer'/>");
                select.parent().append(container);

                select.find('option').each(function(optionIndex, optionElement) {
                    var radioGroup = select.attr('data-mz-value') + "Group";

                    var x = $("<input type='checkbox' name='" + radioGroup + "' />")
                        .attr("value", $(this).val())
                        .appendTo(container);

                    var label = $("<label class='checkbox'/>");
                    container.append(label);

                    $("<span>" + $(this).text() + "</span>").appendTo(label);

                    var $option = $(optionElement);
                    if ($option.attr('selected')) {
                        x.attr('checked', 'checked');
                    }
                });

                container.find("label").mousedown(
                    function(e) {
                        var $span = $(this);
                        var $radio;

                        if ($span.context.tagName == "LABEL") {
                            $radio = $($span.prev());
                        }

                        if ($radio.is(':checked')) {
                            var uncheck = function() {
                                setTimeout(function() {
                                    $radio.prop('checked', true);
                                }, 0);
                            };

                            var unbind = function() {
                                $span.unbind('mouseup', up);
                            };
                            var up = function() {
                                uncheck();
                                unbind();
                            };
                            $span.bind('mouseup', up);
                            $span.one('mouseout', unbind);
                        } else {
                            select.val($radio.val());
                            select.trigger('change');
                        }
                    }
                );
            });
        },

        drillDown: function(e) {
            var $target = $(e.currentTarget),
                id = $target.data('mz-hierarchy-id'),
                field = $target.data('mz-facet');
            this.model.setHierarchy(field, id);
            this.model.updateFacets({
                force: true,
                resetIndex: true
            });
            e.preventDefault();
        },
        setFacetValue: function(e) {
            var $box = $(e.currentTarget),
                attr = $box.attr('checked'),
                hiddenID = $box.attr('id'),
                idToDeselectCheckbox = hiddenID + '_checkbox',
                idToDeselectSize = hiddenID + '_size',
                idToDeselectColor = hiddenID + '_color',
                self = this;
            
            if($('#' + idToDeselectSize).find('.sizelabel').hasClass('sizelabelborder'))
                $('#' + idToDeselectSize).find('.sizelabel').removeClass('sizelabelborder');
            else
                $('#' + idToDeselectSize).find('.sizelabel').addClass('sizelabelborder');
                
            if($('#' + idToDeselectColor).find('.check-icon').hasClass('hidden'))
                $('#' + idToDeselectColor).find('.check-icon').removeClass('hidden');
            else
                $('#' + idToDeselectColor).find('.check-icon').addClass('hidden');
                
            if (typeof attr !== typeof undefined && attr !== false) {
                $('#' + idToDeselectCheckbox).find('input').prop("checked", false);
                $box.prop("checked", false);
            } else {
                $box.prop("checked", true);
            }
            _.defer(function() {
                self.model.setFacetValue($box.data('mz-facet'), $box.data('mz-facet-value'), $box.is(':checked'));
            });
        },
        setColorFacetValue: function(e) {
            var $box = $(e.currentTarget);
            var attr = $box.attr('checked');
            $box.parent('.color-facet-block').find('.check-icon').removeClass('hidden');
            if (typeof attr !== typeof undefined && attr !== false) {
                $box.prop("checked", false);
                this.model.setFacetValue($box.data('mz-facet'), $box.data('mz-facet-value'), false);
            } else {
                $box.prop("checked", true);
                this.model.setFacetValue($box.data('mz-facet'), $box.data('mz-facet-value'), true);
            }
        }
    });
    
    return {
        List: ProductListView,
        FacetingPanel: FacetingPanel
    };
});
