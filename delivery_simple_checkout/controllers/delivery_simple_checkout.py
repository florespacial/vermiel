# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.tools import str2bool

class WebsiteSaleCustom(WebsiteSale):

    @http.route(
        '/shop/address', type='http', methods=['GET'], auth='public', website=True, sitemap=False
    )
    def shop_address(
        self, partner_id=None, address_type='billing', use_delivery_as_billing=None, **query_params
    ):
        website = request.env['website'].sudo().get_current_website()
        
        if website.enable_simple_address:
            # Repetimos el flujo mínimo necesario para llegar al render
            partner_id = partner_id and int(partner_id)
            use_delivery_as_billing = str2bool(use_delivery_as_billing or 'false')
            order_sudo = request.website.sale_get_order()

            if redirection := self._check_cart(order_sudo):
                return redirection

            partner_sudo, address_type = self._prepare_address_update(
                order_sudo, partner_id=partner_id, address_type=address_type
            )

            if partner_sudo:
                use_delivery_as_billing = (
                    order_sudo.partner_shipping_id == order_sudo.partner_invoice_id
                )

            address_form_values = self._prepare_address_form_values(
                order_sudo,
                partner_sudo,
                address_type=address_type,
                use_delivery_as_billing=use_delivery_as_billing,
                **query_params
            )

            return request.render('delivery_simple_checkout.website_sale_address_simplec', address_form_values)
        
        # Fallback: todo igual que Odoo
        return super().shop_address(
            partner_id=partner_id,
            address_type=address_type,
            use_delivery_as_billing=use_delivery_as_billing,
            **query_params
        )
    
    @http.route(
    '/shop/address/submit', type='http', methods=['POST'], auth='public', website=True,
    sitemap=False
    )
    def shop_address_submit(
        self, partner_id=None, address_type='billing', use_delivery_as_billing=None, callback=None,
        required_fields=None, **form_data
    ):

        # Guardar coordenadas de entrega en el pedido
        order_sudo = request.website.sale_get_order()
        lat = form_data.get('delivery_latitude')
        lon = form_data.get('delivery_longitude')

        if order_sudo and lat and lon:
            try:
                # Crear enlace a Google Maps
                google_maps_link = f"https://www.google.com/maps?q={lat},{lon}"
                coordinates_text = f"Coordenadas de entrega: {google_maps_link}"

                order_sudo.sudo().write({
                    'client_order_ref': coordinates_text
                })

            except Exception as e:
                print(f"Error al guardar coordenadas: {str(e)}")
            

        return super().shop_address_submit(
            partner_id=partner_id,
            address_type=address_type,
            use_delivery_as_billing=use_delivery_as_billing,
            callback=callback,
            required_fields=required_fields,
            **form_data
        )
         

    # Nueva ruta de prueba
    @http.route('/shop/testxx', type='http', auth='public', website=True, sitemap=False)
    def shop_test(self, **query_params):
        # Esta es una vista de prueba
        test_values = {
            'message': "¡Bienvenido a la ruta de prueba!"
        }
        return request.render('delivery_simple_checkout.website_sale_test_view', test_values)