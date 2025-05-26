# -*- coding: utf-8 -*-
{
    'name': "Delivery Simple Checkout",
    'summary': """
        Simplifies the checkout address form for specific websites.""",
    'description': """
        Allows enabling a simplified address form (phone, name, address) on the checkout page for selected websites.
    """,
    'author': "Cristian Flores",
    'category': 'Website/eCommerce',
    'version': '1.0',
    'depends': ['website_sale'],
    'data': [
        'views/res_config_settings_views.xml',
        'views/website_sale_checkout.xml',
        'views/test_view.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'delivery_simple_checkout/static/src/js/website_sale.address_minimal.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}

#deps: base_geolocalize