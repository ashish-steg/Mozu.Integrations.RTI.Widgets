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
        {
            xtype: 'container',
            width: '100%',
            layout: 'fit',
            //padding: '20 0 20 0',
            itemId: 'preview-container',
            items: [
                {
                    xtype: 'component',
                    itemId: 'preview',
                    autoEl: 'hr'
                }
            ]
        },
        {
            xtype: "gridpanel",
            itemId: "imagesGrid",
            selType: 'rowmodel',
            store: {fields:
                [
                    {"name": "thumbURL","type":"string"},
                    {"name": "name","type":"string"},
                    {"name": "label","type":"string"},
                    {"name": "srcName","type":"string"},

                ]
            },
            columns: [
                {
                    header: "Image",
                    dataIndex: 'name',
                    sortable: false,
                    hideable: false,
                    width: "100%",
                    height: "100%",
                    renderer: function(val){
                      console.log(val);
                      return '<img src="https://i1.adis.ws/i/mozu/'+val+'?$thumb_desktop$" />';
                    }
                },
                {
                    header: "Name",
                    dataIndex: 'name',
                    hideable: false
                }
                /*{
                    header: "Label",
                    dataIndex: 'label'
                },
                {
                    header: "Source",
                    dataIndex: 'srcName'
                }*/
            ],
            hideHeaders: true,
            listeners: {
                cellclick: function(view, td, cellIndex, record, tr, rowIndex, e, eOpts) {
                  view.up("#amplienceForm").down("#imageName").setValue(record.data.name);
                  console.log(record.data.name);
                }
            }
        }
    ],

    queryImages: function(cmp) {
        cmp.authenticate(function(authToken) {
            console.log(authToken);
            var searchText = cmp.down("#searchTxt").value;
            //requestUrl = 'https://qa-3-dam-api-ssl.adis.ws/v1.5.0/assets?q=(type:"image") AND ('+searchText+')';
            requestUrl = 'https://dam-live-api.adis.ws/v1.5.0/assets?q=(type:"image") AND ('+searchText+') AND (tags:nrf)';
            var token = authToken.content.permissionsToken;
            console.log(token);

             try{

                 Ext.Ajax.request({
                     url: requestUrl,
                     method: "GET",
                    headers: {'X-Amp-Auth':token,'Content-Type': 'application/json'},
                    success: function(result) {
                        var content = Ext.JSON.decode(result.responseText);
                        console.log(Ext.JSON.decode(result.responseText));
                        var grid = cmp.down("#imagesGrid");
                        grid.store.loadData(content.content.data);
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
