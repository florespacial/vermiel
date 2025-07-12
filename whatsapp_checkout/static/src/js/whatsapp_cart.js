/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.WhatsappCartButton = publicWidget.Widget.extend({
  selector: "#whatsapp-button",

  events: {
    click: "_onClick",
  },

  /**
   * @constructor
   */
  init: function () {
    this._super(...arguments);
    this.http = this.bindService("http");
  },

  async _onClick(ev) {
    ev.preventDefault();

    const btn = ev.currentTarget;
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin me-1"></i> Generando...';
    const phoneNumber = 51990312326;

    // Abrir ventana inmediatamente (Safari-friendly)
    const whatsappWindow = window.open("about:blank", "_blank");

    console.log("abirendo ventana de whatsapp de inmediato", whatsappWindow);

    try {
      const response = await this.http.post("/get_whatsapp_url", {
        phone: phoneNumber,
      });

      if (response && response.url) {
        // Redirigir la ventana abierta a la URL real
        whatsappWindow.location.href = response.url;

        // Redirigir página actual después
        setTimeout(() => {
          window.location.href = "/shop/thanks";
        }, 1000);
      } else {
        alert("No se pudo generar el mensaje de WhatsApp.");
        if (whatsappWindow) whatsappWindow.close();
      }
    } catch (error) {
      console.error("Error al obtener la URL de WhatsApp:", error);
      alert("Error al conectar con el servidor.");
      if (whatsappWindow) whatsappWindow.close();
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },
});
