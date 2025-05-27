from odoo import http
from odoo.http import request, Response
import json

class WhatsappCheckoutController(http.Controller):

    @http.route('/get_whatsapp_url', type='http', auth='public', methods=['POST'], website=True, csrf=False)
    def get_whatsapp_url(self, **kw):
        try:
            phone = kw.get('phone')
            order = request.website.sale_get_order()
            if not order:
                return Response(json.dumps({'error': 'No order found'}), 
                              status=400, 
                              mimetype='application/json')
                
            url = order.get_whatsapp_url(phone_number=phone)
            return Response(json.dumps({'url': url}), 
                           status=200, 
                           mimetype='application/json')
            
        except Exception as e:
            return Response(json.dumps({'error': str(e)}), 
                          status=500, 
                          mimetype='application/json')

    @http.route('/shop/thanks', type='http', auth='public', website=True, csrf=False)
    def thanks_page(self, **kw):
        # Limpiar el carrito de compras
        order = request.website.sale_get_order()
        if order:
            # # Eliminar todas las líneas del pedido
            # order.order_line.unlink()
            # # Cancelar el pedido para evitar que se reconfirme accidentalmente
            # order.action_cancel()
            # # Limpiar el carrito de la sesión
            # request.session.pop('sale_order_id', None)

            order.order_line.unlink()
            order.action_cancel()
            request.session.pop('sale_order_id', None)
        
        # Renderizar la plantilla de agradecimiento
        return request.render("whatsapp_checkout.thanks_page_template")