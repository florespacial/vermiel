from odoo import models, fields, api   
from urllib.parse import quote   
   
class SaleOrder(models.Model):   
    _inherit = 'sale.order'   
   
    def get_whatsapp_message(self):   
        """   
        Genera un mensaje de WhatsApp con el contenido del pedido,   
        usando el mismo formato del carrito web.   
        """   
        if not self.order_line:   
            return "🛒 Mi carrito está vacío"   
   
        message = "¡Hola VERMIEL! 🍯🐝\n"
        message += "Me gustaría hacer mi pedido:\n\n"   
        message += "🛍️ *MI PEDIDO:* 🛍️\n\n"   
    
        for line in self.order_line:   
            message += f"🔹 {line.name}\n"   
               
            # Reutilizamos exactamente lo que muestra el carrito web   
            # for desc in line.get_description_following_lines():   
            #     if desc:   
            #         message += f"   {desc}\n"   
   
            message += f"#️⃣ Cantidad: {line.product_uom_qty}\n"   
            message += f"▶️ Precio unitario: S/ {line.price_unit:,.2f}\n"
            message += f"\n"
        message += "------------------------------\n"
        message += f"💵 *TOTAL: S/ {self.amount_total:,.2f}* \n\n"   
   
    
        # Llamado a la acción para solicitar ubicación
        message += "📍 _Para coordinar la entrega, por favor envíe su ubicación_ 📍"
        

        return quote(message)   
   
    def get_whatsapp_url(self, phone_number=None):   
        """   
        Genera la URL completa de WhatsApp usando api.whatsapp.com/send   
        """   
        message = self.get_whatsapp_message()   
           
        if phone_number:   
            clean_phone = ''.join(filter(str.isdigit, phone_number))   
            return f"https://api.whatsapp.com/send?phone={clean_phone}&text={message}"   
        else:   
            return f"https://api.whatsapp.com/send?text={message}"