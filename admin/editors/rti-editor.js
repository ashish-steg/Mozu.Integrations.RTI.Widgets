
  Ext.define('myEditors.rti-editor', {
        extend: 'Ext.form.Panel',

        initComponent: function() {
            var me = this;
            // var radiogroup = me.down('#radio-field');
            // console.log("wwww"+radiogroup.getValue());



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

                me.getComboboxOptions(widgetNameReqUrl, 'page-template');
              }

            });

            this.items = [
              {
                xtype: 'radiogroup',
                fieldLabel: 'Widget Type',
                layout: 'hbox',
                defaultType: 'radiofield',
                id: 'radio-field',
                listeners: {
                  change: function(item, state){
                    if (state.widgetType == "child"){
                      me.down("#params-box").hide();
                    } else {
                      me.down("#params-box").show();
                    }
                  }
                },
                items: [
                  {
                    boxLabel: 'Master',
                    name: 'widgetType',
                    inputValue: 'master',
                    itemId: 'master-radio'
                  },
                  {
                    boxLabel: 'Child',
                    name: 'widgetType',
                    inputValue: 'child',
                    itemId: 'child-radio',
                    margin: '0 0 0 30px'
                  }

                ]


              },

              {
                 xtype: 'mz-input-dropdown',
                 name: 'pageTemplate',
                 fieldLabel: 'Page Template',
                 itemId: 'page-template',
                 store: {
                    fields: ['id', 'placeholderName'],
                    data: []
                 },
                 allowBlank: false,
                 displayField: 'id',
                 valueField: 'placeholderName',
                 queryMode: 'local',
                 editable: true,
                 forceSelection: true,
                 margin: '0 0 30px 0',
             },
            //  {
            //    xtype: 'mz-input-dropdown',
            //    name: 'placeholder',
            //    fieldlabel: 'Placeholder',
            //    itemId: 'placeholder',
            //    store: {
            //      data: []
            //    },
            //    queryMode: 'local'
            //  },
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
              itemId: 'params-box',
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
        request.open('GET', "https://sun-fun2.baynote.net/recs/1/sun_fun2/?pageTemplate=Home&attrs=Price&attrs=ProductId&attrs=ThumbUrl&attrs=Title&attrs=url&url=https://t17403-s27146.sandbox.mozu.com/obermeyer-girl-s-patchwork-knit-hat/p/2415064588308&format=json", true);
        request.addEventListener('load', function(res) {
                var result = JSON.parse(res.currentTarget.responseText);
                var items = result.widgetResults;
                console.log(items);
                var select = me.down(boxId);
                var store = select.getStore();
                store.insert(0, items);
            }
        );
        request.send(null);

      }

  });
Ext.create('myEditors.rti-editor');
