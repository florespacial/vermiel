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

    try {
      const response = await this.http.post("/get_whatsapp_url", {
        phone: phoneNumber,
      });
      if (response && response.url) {
        // Abrir WhatsApp en nueva pestaña
        const whatsappWindow = window.open(response.url, "_blank");

        // Esperar un momento para asegurar que WhatsApp se abrió correctamente
        // y luego redirigir la página actual
        setTimeout(() => {
          window.location.href = "/shop/thanks";
        }, 1000); // Esperar 1 segundo antes de redirigir
      } else {
        alert("No se pudo generar el mensaje de WhatsApp.");
      }
    } catch (error) {
      console.error("Error al obtener la URL de WhatsApp:", error);
      alert("Error al conectar con el servidor.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },
});
