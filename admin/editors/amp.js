Ext.Loader.setConfig({enabled: true});

//Ext.Loader.setPath('Ext.ux.DataView', '../ux/DataView/');

Ext.require([
    'Ext.data.*',
    'Ext.util.*',
    'Ext.view.View',
    //'Ext.ux.DataView.DragSelector',
    //'Ext.ux.DataView.LabelEditor'
]);

Ext.onReady(function() {
    Ext.util.CSS.createStyleSheet("#imagesGrid .thumb img{width: 150px;}");
    Ext.util.CSS.createStyleSheet("#imagesGrid .thumb-wrap{float: left;margin: 0px;margin-right: 0;padding: 2px;}");
    //Ext.util.CSS.createStyleSheet("#imagesGrid .x-item-selected{background: #eff5fb url(selected.gif) no-repeat right bottom;border:1px solid #99bbe8;padding: 4px;}");
    Ext.util.CSS.createStyleSheet("#imagesGrid .thumb{background: #dddddd;padding: 3px;padding-bottom: 0;}");
    Ext.util.CSS.createStyleSheet("#imagesGrid .x-panel-body {background: white; font: 11px Arial, Helvetica, sans-serif;}");
    Ext.util.CSS.createStyleSheet("#imagesGrid .thumb-wrap span {display: block;overflow: hidden;text-align: center;width: 86px; /* for ie to ensure that the text is centered */}");
    Ext.util.CSS.createStyleSheet(".x-quirks #imagesGrid .thumb {padding-bottom: 3px;}");
    //Ext.util.CSS.createStyleSheet("#imagesGrid .x-item-over{border:1px solid #dddddd;background: #efefef url(over.gif) repeat-x left top;padding: 4px;}");
    Ext.util.CSS.createStyleSheet("#imagesGrid .x-item-selected .thumb{background:transparent;}");
    Ext.util.CSS.createStyleSheet(".x-view-selector {position:absolute;left:0;top:0;width:0;border:1px dotted;opacity: .5;-moz-opacity: .5;filter:alpha(opacity=50);zoom:1;background-color:#c3daf9;border-color:#3399bb;}");
    Ext.util.CSS.createStyleSheet(".ext-strict .ext-ie .x-tree .x-panel-bwrap{position:relative;overflow:hidden;}");
  });

var store = Ext.create('Ext.data.Store', {
      fields:
            [
              {"name": "thumbURL","type":"string"},
              {"name": "name","type":"string"},
              {"name": "label","type":"string"},
              {"name": "srcName","type":"string"},
            ]
    });
Ext.widget({
    xtype: 'mz-form-widget',
    itemId: 'amplienceForm',



    items: [
        {
            fieldLabel: 'Search',
            name: 'searchTxt',
            itemId: 'searchTxt',
            xtype: 'mz-input-text'
        },
        {
              fieldLabel: 'Selected Image',
              name: 'imageName',
              itemId: 'imageName',
              editable: true,
              hidden: true,
              xtype: 'mz-input-text'
        },
        {
              xtype: 'button',
              text: "Search",
              handler: function (cmp){
              var parent = cmp.up('#amplienceForm');
              parent.queryImages(parent);
            }
        },
        //{
            //xtype: 'container',
            //width: '100%',
            //layout: 'fit',
            //padding: '20 0 20 0',
            //itemId: 'preview-container',
            // items: [
            //     {
            //         //xtype: 'component',
            //         //itemId: 'preview',
            //         //autoEl: 'hr'
            //     }
            //]
        //},
        // {
        //           xtype: 'dataview',
        //           itemId: "imagesGrid",
        //           store: Ext.create('Ext.data.Store', {
        //               fields:
        //                       [
        //                           {"name": "thumbURL","type":"string"},
        //                           {"name": "name","type":"string"},
        //                           {"name": "label","type":"string"},
        //                           {"name": "srcName","type":"string"},
        //
        //                       ]
        //           }),
        //           tpl: [
        //               '<tpl for=".">'
        //                   , '<div class="thumb-wrap">'
        //                       ,'<div class="thumb"><img src="https://i1.adis.ws/i/mozu/{name}?$thumb_desktop$"></div>'
        //                   , '</div>'
        //               , '</tpl>'
        //               , '<div class="x-clear"></div>'
        //           ],
        //           overItemCls: 'x-item-over',
        //           itemSelector: 'div.thumb-wrap',
        //           emptyText: 'No images available',
        //           renderTo: Ext.getBody()
        //       }


              Ext.create('Ext.Panel', {
                  id: 'imagesGrid',
                  autoScroll:true,
                  frame: true,
                  collapsible: true,
                  width: 800,
                  renderTo: Ext.getBody(),
                  title: 'Select an image:',
                  items: Ext.create('Ext.view.View', {
                  store: store,
                  tpl: [
                          ,'<tpl for=".">'
                              , '<div class="thumb-wrap">'
                                  ,'<div class="thumb"><img src="https://i1.adis.ws/i/mozu/{name}?$thumb_desktop$"></div>'
                              , '</div>'
                          , '</tpl>'
                          , '<div class="x-clear"></div>'
                      ],
                      //multiSelect: true,
                      height: 310,
                      trackOver: true,
                      overItemCls: 'x-item-over',
                      itemSelector: 'div.thumb-wrap',
                      emptyText: 'No images to display',
                      plugins: [
                            //Ext.create('Ext.ux.DataView.DragSelector', {}),
                            //Ext.create('Ext.ux.DataView.LabelEditor', {dataIndex: 'name'})
                      ],
                      listeners: {
                          selectionchange : function(d, i, n, e) {
                          //console.log(i[0].data.name);
                          //console.log(d);
                          //console.log(n);
                          d.view.up("#amplienceForm").down("#imageName").setValue(i[0].data.name);
                          }
                      }
                      // listeners: {
                      //     cellclick: function(view, td, cellIndex, record, tr, rowIndex, e, eOpts) {
                      //       view.up("#amplienceForm").down("#imageName").setValue(record.data.name);
                      //       console.log(record.data.name);
                      //     }
                      // }
                  })
              })

        // {
        //     xtype: "gridpanel",
        //     itemId: "imagesGrid",
        //     selType: 'rowmodel',
        //     store: {fields:
        //         [
        //             {"name": "thumbURL","type":"string"},
        //             {"name": "name","type":"string"},
        //             {"name": "label","type":"string"},
        //             {"name": "srcName","type":"string"},
        //
        //         ]
        //     },
        //     columns: [
        //         {
        //             header: "Image",
        //             dataIndex: 'name',
        //             sortable: false,
        //             hideable: false,
        //             width: "100%",
        //             height: "100%",
        //             renderer: function(val){
        //               console.log(val);
        //               return '<img src="https://i1.adis.ws/i/mozu/'+val+'?$thumb_desktop$" />';
        //             }
        //         },
        //         {
        //             header: "Name",
        //             dataIndex: 'name',
        //             hideable: false
        //         }
        //         /*{
        //             header: "Label",
        //             dataIndex: 'label'
        //         },
        //         {
        //             header: "Source",
        //             dataIndex: 'srcName'
        //         }*/
        //     ],
        //     hideHeaders: true,
    ],

    queryImages: function(cmp) {
        cmp.authenticate(function(authToken) {
            //console.log(authToken);
            var searchText = cmp.down("#searchTxt").value;
            //requestUrl = 'https://qa-3-dam-api-ssl.adis.ws/v1.5.0/assets?q=(type:"image") AND ('+searchText+')';
            requestUrl = 'https://dam-live-api.adis.ws/v1.5.0/assets?q=(type:"image") AND ('+searchText+') AND (tags:nrf)';
            var token = authToken.content.permissionsToken;
            //console.log(token);

             try{

                 Ext.Ajax.request({
                     url: requestUrl,
                     method: "GET",
                    headers: {'X-Amp-Auth':token,'Content-Type': 'application/json'},
                    success: function(result) {
                        var content = Ext.JSON.decode(result.responseText);
                        //console.log(Ext.JSON.decode(result.responseText));
                        //var grid = cmp.down("#imagesGrid");
                        grid = Ext.getCmp("imagesGrid");
                        //console.log("store:"+store);
                        store.loadData(content.content.data);
                    },
                    failure: function(err) {
                        console.log(err);
                    }
                 });

            }catch(e){
                console.log(e);
            }
        });
    },
    authenticate: function(callback){
        try{

            Ext.Ajax.request({
                //url: "https://qa-3-dam-api-ssl.adis.ws/v1.5.0/auth",
                url: "https://dam-live-api.adis.ws/v1.5.0/auth",
                method: "POST",
                params: Ext.JSON.encode({username: "mi.guelgonzalez@gmail.com", password: "Bx8d3CYn"}),
                headers: { 'Content-Type': 'application/json' },
                success: function(result) {
                    callback(Ext.JSON.decode(result.responseText));
                },
                failure: function(err) {
                    console.log(err);
                }
            });
        }catch(e){
            console.log(e);
        }
    }

});
