define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'hyprlive', 'modules/api', 'underscore'], function($, Hypr, api, _) {

    // bundled typeahead saves a lot of space but exports bloodhound to the root object, let's lose it
    var Bloodhound = window.Bloodhound.noConflict();

    // bloodhound wants to make its own AJAX requests, and since it's got such good caching and tokenizing algorithms, i'm happy to help it
    // so instead of using the SDK to place the request, we just use it to get the URL configs and the required API headers
    var qs = '%QUERY',
        eqs = encodeURIComponent(qs),
        suggestPriorSearchTerms = Hypr.getThemeSetting('suggestPriorSearchTerms'),
        getApiUrl = function(groups) {
            return api.getActionConfig('suggest', 'get', { query: qs, groups: groups }).url;
        },
        termsUrl = getApiUrl('terms'),
        productsUrl = getApiUrl('pages'),
        pageContext = require.mozuData('pagecontext'),
        ajaxConfig = {
            headers: api.getRequestHeaders(),
            beforeSend: function(xhr) {
                $('.tt-dataset-pages').html('<span class="spinner icon-spinner-2" style="display:inline-block;"></span>');
            }
        },
        i,
        nonWordRe = /\W+/,
        makeSuggestionGroupFilter = function(name) {
            return function(res) {
                var suggestionGroups = res.suggestionGroups,
                    thisGroup;
                for (i = suggestionGroups.length - 1; i >= 0; i--) {
                    if (suggestionGroups[i].name === name) {
                        thisGroup = suggestionGroups[i];
                        break;
                    }
                }
                return thisGroup.suggestions;
            };
        },

        makeTemplateFn = function(name) {
            var tpt = Hypr.getTemplate(name);
            return function(obj) {
                return tpt.render(obj);
            };
        },

    // create bloodhound instances for each type of suggestion

    AutocompleteManager = {
        datasets: {
            pages: new Bloodhound({
                datumTokenizer: function(datum) {
                    return datum.suggestion.term.split(nonWordRe);
                },
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: {
                    url: productsUrl,
                    wildcard: eqs,
                    filter: makeSuggestionGroupFilter("Pages"),
                    rateLimitWait: 400,
                    ajax: ajaxConfig
                }
            })
        }
    };

    $.each(AutocompleteManager.datasets, function(name, set) {
        set.initialize();
    });
    var showProducts = function(categories) {
        _.defer(function() {
            $('.tt-dataset-cat').remove();
            var categoriescount = categories.length;
            var remainingcategories = categoriescount - 3;
            var counter = 0;
                    
            _.each(categories, function(category) {
                counter++;
                var element = '<div class="tt-dataset-cat">';
                if(counter <= 3){
                    
                    if(category.parentCategory) {
                        element += '<span class="tt-dataset-current-prod-cat"><a href="/c/'+ category.categoryId+'">' + category.content.name + '</a></span>' +
                                '<span class="tt-dataset-current-prod-parent-cat"><a href="/c/' + category.parentCategory.categoryId + '"> in > ' + category. parentCategory.content.name + window.chevron +'</a></span>';
                    } else {
                        element += '<span class="tt-dataset-current-prod-cat"><a href="/c/'+ category.categoryId+'">' + category.content.name + '</a></span>';
                    }
                    
                    element += '</div>';
                    $('.tt-dataset-pages').before(element);
                }
                if(counter === 4) {
                    element += "<span class='tt-dataset-more-categories'><a href='/search?query=" + AutocompleteManager.$typeaheadField[1].value + "'> + " +remainingcategories+ " more categories</a></span>";
                    element += '</div>';
                    $('.tt-dataset-pages').before(element);
                }
            });
        });
    };
    var dataSetConfigs = [
        {
            name: 'pages',
            displayKey: function(datum) {
                showProducts(datum.suggestion.categories);
            },
            templates: {
                suggestion: makeTemplateFn('modules/search/autocomplete-page-result'),
                empty: '<div class="empty-box"> no results found, please try a different search </div> '
            },
            source: AutocompleteManager.datasets.pages.ttAdapter()
        }
    ];

    if (suggestPriorSearchTerms) {
        AutocompleteManager.datasets.terms = new Bloodhound({
            datumTokenizer: function(datum) {
                return datum.suggestion.term.split(nonWordRe);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote: {
                url: termsUrl,
                wildcard: eqs,
                filter: makeSuggestionGroupFilter("Terms"),
                rateLimitWait: 100,
                ajax: ajaxConfig
            }
        });
        AutocompleteManager.datasets.terms.initialize();
        dataSetConfigs.push({
            name: 'terms',
            displayKey: function(datum) {
                return datum.suggestion.term;
            },
            
            source: AutocompleteManager.datasets.terms.ttAdapter()
        });
    }
 
    $(document).ready(function() {
        var $field = AutocompleteManager.$typeaheadField = $('[data-mz-role="searchquery"]');
        AutocompleteManager.typeaheadInstance = $field.typeahead({
            hint: true,highlight: true,minLength: 1,items:4
        }, dataSetConfigs).data('ttTypeahead');
        window.chevron = ( $(".chevron-arrow").html() );
        // user hits enter key while menu item is selected;
        $field.on('typeahead:selected', function (e, data, set) {
            if (data.suggestion.productCode) window.location = "/p/" + data.suggestion.productCode;
        });
        
        $field.on('typeahead:closed', function (e, data, set) {
            $('.mz-pageheader, .mz-homepageheader').css('opacity', '0.94');
        });
        $field.on('typeahead:opened', function (e, data, set) {
            $('.mz-pageheader, .mz-homepageheader').css('opacity', '1');
        });
    });

    return AutocompleteManager;
});