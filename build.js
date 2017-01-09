({
    paths: {
        jquery: "empty:",
        sdk: "empty:",
        hyprlive: "empty:",
        hyprlivecontext: "empty:",
        underscore: "vendor/underscore/underscore",
        backbone: "vendor/backbone/backbone",
        bootstrap :  "vendor/bootstrap.min"
    },
    dir: "compiled/scripts/",
    locale: "en-us",
    optimize: "uglify2",
    keepBuildDir: false,
    optimizeCss: "none",
    removeCombined: true,
    skipPragmas: true,
    modules: [
        {
            name: "modules/common",
           include: [
                'modules/api',
                'modules/backbone-mozu',
                'modules/backbone-mozu-model',
                'modules/backbone-mozu-view',
                'modules/backbone-mozu-pagedcollection',
                'modules/cart-monitor',
                'modules/contextify',
                'modules/jquery-mozu',
                'modules/login-links',
                'modules/models-address',
                'modules/models-customer',
                'modules/models-documents',
                'modules/models-faceting',
                'modules/models-messages',
                'modules/models-product',
                'modules/models-cart',
                'modules/scroll-nav',
                'modules/search-autocomplete',
                'modules/views-collections',
                'modules/views-messages',
                'modules/views-paging',
                'modules/views-productlists',
                'modules/menu',
                'modules/signup',
                'modules/page-header',
                'vendor/jquery/bootstrap-slider',
                'vendor/jquery/instafeed',
                'vendor/jquery/jquery-ui',
                'vendor/jquery/lazysizes-custom.min',
                'vendor/jquery/owl.carousel.min',
                'vendor/jquery/jquery.bxslider.min',
                'modules/soft-cart',
            ],
            exclude: ['jquery'],
        },
        {
            name: "pages/cart",
            exclude: ["modules/common"]
        },
        {
            name: "pages/category",
            exclude: ["modules/common"]
        },
        {
            name: "pages/checkout",
            exclude: ["modules/common"]
        },
        {
            name: "pages/error",
            exclude: ["modules/common"]
        },
        {
            name: "pages/location",
            exclude: ["modules/common"]
        },
        {
            name: "pages/myaccount",
            exclude: ["modules/common"]
        },
        {
            name: "pages/product",
            exclude: ["modules/common"]
        },
        {
            name: 'pages/search',
            exclude: ["modules/common"]
        }
    ]
});
