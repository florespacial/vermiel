# Copyright 2022 Studio73 - Ioan Galan <ioan@studio73.es>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    "name": "Website Whatsapp",
    "summary": "Whatsapp integration",
    "category": "Website",
    "version": "18.0.1.1.0",
    "author": "Cristian Flores",
    "license": "AGPL-3",
    "depends": ["website"],
    "data": [
        "templates/website.xml",
        "views/res_config_settings.xml",
    ],
    "assets": {
        "web.assets_frontend": ["/website_whatsapp/static/src/scss/website.scss"]
    },
    "installable": True,
}
