Ext.widget({
  xtype: 'mz-form-widget',
  itemId: 'rti-config-editor',
  initComponent: function(){
    var me = this;
    var jsInjectPlaceholder = "//Use this space for any custom scripting (such as collecting custom cookies).";
    jsInjectPlaceholder += "\n//Append additional parameters to the 'inject' variable.";
    jsInjectPlaceholder += "\n// inject += '&visitstrail=...'";
    this.items = [
     {
       xtype: 'panel',
       layout: 'vbox',
       itemId: 'params-box',
       items: [

           {
             xtype: 'mz-input-text',
             cls: 'textbox',
             name: 'params',
             allowBlank: true,
             emptyText: 'Enter query style',
             fieldLabel: 'Additional Parameters',
             margin: '0 0 30px 0'
          },

          {
            xtype: 'box',
            margin: '0 0 30px 0',
            html: "Price, Product ID, Thumbnail URL, and Title variables are automatically imported."
          },


      {
        xtype: 'panel',
        margin: '0 0 30px 0',
        items:[
          {
            xtype: 'box',
            html: 'Include in Query'
          },

          {
              xtype: 'mz-input-checkbox',
              name: 'includeTenantId',
              fieldLabel: 'Tenant ID',
          },
          {
               xtype: 'mz-input-checkbox',
               name: 'includeSiteId',
               fieldLabel: 'Site ID',
               margin: '-5px 0 0 0'
          }
        ]
      },
      ]
     },

     {
       xtype: 'mz-input-code',
       name: 'javascriptInjection',
       itemId: 'javascript-injection',
       fieldLabel: 'Enter javascript',
       mode: 'javascript',
       value: jsInjectPlaceholder
     },

      {
        xtype: 'hidden',
        name: 'isConfigged',
        itemId:'isConfigged',
        value: false
      }
    ];

    this.superclass.initComponent.apply(this, arguments);
  },

  setCustomerInfo: function(customerCode, customerId){
    var me = this;
    var customerCodeInput = me.down('#customerCode');
    var customerIdInput = me.down('#customerId');

    customerCodeInput.setValue(customerCode);
    customerIdInput.setValue(customerId);


  },
  getComboboxOptions: function(reqUrl, boxId){
    var me = this;

    //boxId can be given with or without the # at the front.
    if (boxId.charAt(0)!=='#'){
      boxId = '#'+boxId;
    }

    var items;
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
