
  Ext.define('myEditors.rti-editor', {
        extend: 'Ext.form.Panel',
        cls: 'editor-body',

        initComponent: function() {
            var me = this;
            //Request to
            Ext.Ajax.request({
              url: "/admin/app/entities/read?list=rtiSettings%40KiboDD&entityType=mzdb",
              method: 'get',
              success: function (res) {
                var response = JSON.parse(res.responseText);
                var customerCode = response.items[0].item.customerCode;
                var customerId = response.items[0].item.customerId;
                var widgetNameReqUrl = '//' + customerId + '-' + customerCode + '.baynote.net/merch/1/' + customerId + '_' + customerCode + '/production/pageTypes';
                var customerCodeInput = me.down('#customerCode');
                var customerIdInput = me.down('#customerId');

                customerCodeInput.setValue(customerCode);
                customerIdInput.setValue(customerId);

                me.getComboboxOptions(widgetNameReqUrl, 'widget-name');
              }

            });

            this.items = [
             {
                 xtype: 'mz-input-dropdown',
                 name: 'widgetName',
                 cls: 'dropdown',
                 fieldLabel: 'Widget Name</br><i>For internal use only</i>',
                 font: 'Courier',
                 itemId: 'widget-name',
                 store: {
                    fields: ['placeholders', 'name'],
                    data: []
                 },
                 allowBlank: false,
                 displayField: 'name',
                 valueField: 'name',
                 queryMode: 'local',
                 editable: false,
                 forceSelection: true,
                 margin: '0 0 30px 0',
                 border: '1px solid blue'
             },
             {
                 xtype: 'mz-input-dropdown',
                 cls: 'dropdown',
                 name: 'strategy',
                 allowBlank: false,
                 fieldLabel: 'Strategy',
                 itemId: 'strategy',
                 store: ['Revenue Optimized', 'Bought together', 'Trending',
                  'Top Sellers','Popular','Complements','Last Viewed',
                  'Substitutes', 'Engagement Optimized', 'Bundle', 'Upsell'],
                //  displayField: 'name',
                //  valueField: 'name',

                 queryMode: 'local',
                 editable: false,
                 forceSelection: true,
                 margin: '0 0 30px 0',
                 typeAhead: true
             },

             {
               xtype: 'mz-input-text',
               cls: 'textbox',
               allowBlank: false,
               name: 'title',
               emptyText: 'You may also like:',
               fieldLabel: 'Display Title</br><i>Displayed on storefront</i>',
               margin: '0 0 30px 0'
            },

            {
              xtype: 'panel',
              layout: 'hbox',
              items: [

                  {
                    xtype: 'mz-input-text',
                    cls: 'textbox',
                    name: 'params',
                    allowBlank: false,
                    emptyText: 'Enter query style',
                    fieldLabel: 'Additional parameters',
                    margin: '0 0 30px 0'
                 },


             {
               xtype: 'panel',
               margin: '0 0 0 30px',
               items:[
                 {
                   xtype: 'box',
                   html: 'Include in query:'
                },

                 {
                     xtype: 'mz-input-checkbox',
                     name: 'includeTenantId',
                     fieldLabel: 'Tenant ID',
                     margin: '0 0 30px 0px'
                  },

                  {
                      xtype: 'mz-input-checkbox',
                      name: 'includeSiteId',
                      fieldLabel: 'Site ID',
                      margin: '0 0 30px 0px'
                   }

               ]
             },

             ]

            },
            {
              xtype: 'box',
              html: "Here's some text specifying which variables are automatically imported."
            },

              {
                xtype: 'numberfield',
                cls: 'dropdown',
                name: 'numberOfItems',
                fieldLabel: 'Quantity of Items to Display',
                minValue: 1,
                value: 5,
                margin: '0 0 30px 0'
              },

              {
                xtype: 'hidden',
                name: 'customerId',
                itemId: 'customerId',
                value: 'noneya'
              },
              {
                xtype: 'hidden',
                name: 'customerCode',
                itemId: 'customerCode',
                value: 'noneya'
              },

            //  {
            //     xtype: 'mz-input-text',
            //     name: 'demoUrl',
            //     fieldLabel: 'Demo URL'
            //  },
            //  {
            //      xtype: 'checkbox',
            //      name: 'demoItems',
            //      fieldLabel: 'Enable demo data?',
            //      margin: '0 0 30px 0px'
            //   },

          ];

          this.superclass.initComponent.apply(this, arguments);

      },

//reqUrl - api request url
//boxId - itemId of associated combobox

      getComboboxOptions: function(reqUrl, boxId){
        var me = this;

        //boxId can be given with or without the # at the front.
        if (boxId.charAt(0)!=='#'){
          boxId = '#'+boxId;
        }

        var request = new XMLHttpRequest();
        request.open('GET', reqUrl, true);
        request.addEventListener('load', function(res) {
                var items = JSON.parse(res.currentTarget.responseText);
                var select = me.down(boxId);
                var store = select.getStore();
                store.insert(0, items);
            }
        );
        request.send(null);
      }

  });
Ext.create('myEditors.rti-editor');
