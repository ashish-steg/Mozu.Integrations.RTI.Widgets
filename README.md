# Theme Widget for the RTI Application by Kibo

This repository contains files for the theme widget that accompanies the [RTI Application by Kibo](https://www.mozu.com/docs/guides/rti/rti-configuration.htm). You can add this widget to the checkout page of your Mozu site(s) to enable observer tags, Recommendation on PDP or category pages and capture order details.


##Widget Files

This widget adds the following files:
* `templates/Widgets/RTI/rti-observation.hypr`
* `templates/Widgets/RTI/rti-product-tiles.hypr.live`
* `templates/Widgets/RTI/rti-rec-template.hypr`
* `scripts/widgets/rti-observation.js`
* `scripts/widgets/rti/recommended-products.js`
* `scripts/widgets/rti/rti-rec-script.js`
* `admin/editors/rti-rec-editor.js`
* `resources/admin/widgets/rti-observation.png`
* `resources/admin/widgets/rti-recommend.png`

And updates the following file:
* `theme.json`

    Add the following under widgets section
    ```
     {
        "displayName": "RTI Recommended Products",
        "displayTemplate": "RTI/rti-rec-template",
        "customEditor": "rti-rec-editor",
        "icon": "/resources/admin/widgets/rti-recommend.png",
        "id": "rti-rec-display",
        "validPageTypes": [
          "*"
        ]
    },
    {
        "displayName": "RTI Observation Tag",
        "displayTemplate": "RTI/rti-observation.hypr",
        "icon": "/resources/admin/widgets/rti-observation.png",
        "id": "rti-observation-tag",
        "validPageTypes":[ "*" ]
    }
    ```

##Update Your Theme

1.	Clone or download this repository.
2.	Add or merge the files listed above. 
3.	Run Grunt to build the theme.
4.	Upload the resulting ZIP file to Mozu Dev Center.
5.	Install the updated theme to the sandbox you’re working in.
6.	In Mozu Admin, go to **SiteBuilder** > **Themes**, right-click the new theme, and click **Apply**.

##Add the Observation tag Widget to Your site

1.	In Mozu Admin, go to **SiteBuilder** > **Editor**.
2.	In the **Site tree**, navigate to **Templates** > **Default Site Template**.
3.	Click the **Widgets** button at the top of the editor.
4.	Drag the **RTI Observation Tag** widget to  dropzone on the footer. The widget is not visible to customers. This widget captures the order details on confirmation and search terms.

##Add the Recommendation Widget to product page

1.	In Mozu Admin, go to **SiteBuilder** > **Editor**.
2.	In the **Site tree**, navigate to **Templates** > **Product**.
3.	Click the **Widgets** button at the top of the editor.
4.	Drag the **RTI Recommended Products** widget to any dropzone the page. Configure the widget and save.
5.  **Title** - if none specied, widget title from RTI will be used
6.  **Page Type** - Select page type from RTI (Has to be created in RTI first)
7.  **Placeholder Name** - Specify the placeholder from RTI widget from which to display products.
8.  **TenantId** - Add tenantId to query string to for filtering if using on sandbox.
9.  **SiteId** - Add siteId to query string to for filtering if using on sandbox.
