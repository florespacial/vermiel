# __manifest__.py
{
    'name': 'WhatsApp Cart Integration',
    'version': '1.0',
    'category': 'Website/eCommerce',
    'summary': 'Permite enviar el carrito de compras por WhatsApp',
    'description': """
        Este módulo añade funcionalidad para enviar el contenido del carrito
        de compras directamente por WhatsApp desde el sitio web.
    """,
    'author': 'Cristian Flores',
    'depends': ['website_sale'],
    'data': [
        'views/website_sale_templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'whatsapp_checkout/static/src/js/whatsapp_cart.js',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
}