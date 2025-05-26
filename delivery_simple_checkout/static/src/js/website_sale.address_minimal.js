/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.websiteSaleMinimalAddress = publicWidget.Widget.extend({
  selector: ".o_wsale_simple_address_fill",
  events: {
    "input #o_phone": "_onPhoneChange",
    "click #save_address": "_onSaveAddress",
  },

  /**
   * @constructor
   */
  init: function () {
    this._super(...arguments);
    this.http = this.bindService("http");

    this.addressForm = document.querySelector("form.checkout_autoformat");
    this.errorsDiv = document.getElementById("errors");
    this.map = null;
    this.marker = null;
    this.storeMarker = null;

    // Coordenadas de Huaraz - Ancash, Perú (Plaza de Armas)
    this.defaultLat = -9.5277;
    this.defaultLng = -77.5279;

    // Coordenadas de la tienda VERMIEL
    this.storeLat = -9.528824;
    this.storeLng = -77.530434;
    this.storeName = "VERMIEL";

    // Flag para rastrear si el usuario ha seleccionado una ubicación
    this.locationSelected = false;
    this.selectedAddress = null;
  },

  /**
   * Initialize the map when the widget starts
   */
  start: function () {
    this._super(...arguments);
    this._initializeMap();
    this._checkInitialPhoneValue();
  },

  /**
   * Initialize the map (using Leaflet as it's free and doesn't require API keys)
   * @private
   */
  async _initializeMap() {
    const mapContainer = document.getElementById("delivery_map");
    if (!mapContainer) {
      console.error("Map container not found");
      return;
    }

    try {
      // Load Leaflet CSS and JS dynamically
      await this._loadLeaflet();

      // Initialize the map centered on Huaraz
      this.map = L.map("delivery_map").setView(
        [this.defaultLat, this.defaultLng],
        14
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(this.map);

      // Add store marker first
      this._addStoreMarker();

      // Add click event to map for placing delivery marker
      this.map.on("click", (e) => {
        this._selectLocation(e.latlng.lat, e.latlng.lng);
      });

      // Add current location button and instructions
      this._addLocationButton();
      this._addMapInstructions();

      console.log("Map initialized successfully - Centered on Huaraz, Ancash");
    } catch (error) {
      console.error("Error initializing map:", error);
      this._showMapError();
    }
  },

  /**
   * Add store marker to the map
   * @private
   */
  _addStoreMarker() {
    // Create custom icon for store
    const storeIcon = L.divIcon({
      html: `
        <div style="
          background-color: #dc3545;
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">
          <i class="fa fa-store" style="font-size: 14px;"></i>
        </div>
      `,
      className: "store-marker",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Add store marker
    this.storeMarker = L.marker([this.storeLat, this.storeLng], {
      icon: storeIcon,
      draggable: false,
    }).addTo(this.map);

    // Add popup to store marker
    this.storeMarker.bindPopup(
      `
      <div style="text-align: center; padding: 5px;">
        <strong style="color: #dc3545; font-size: 16px;">
          <i class="fa fa-store"></i> ${this.storeName}
        </strong><br>
        <small style="color: #666;">
          Tienda de origen<br>
          <i class="fa fa-map-marker"></i> Huaraz, Ancash
        </small>
      </div>
    `,
      {
        closeButton: false,
        className: "store-popup",
      }
    );

    // Show popup initially
    this.storeMarker.openPopup();

    console.log(`Store marker added for ${this.storeName} at coordinates:`, {
      lat: this.storeLat,
      lng: this.storeLng,
    });
  },

  /**
   * Load Leaflet library dynamically
   * @private
   */
  _loadLeaflet() {
    return new Promise((resolve, reject) => {
      // Check if Leaflet is already loaded
      if (window.L) {
        resolve();
        return;
      }

      // Load CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * Handle location selection on map
   * @private
   */
  async _selectLocation(lat, lng) {
    // Create custom icon for delivery location
    const deliveryIcon = L.divIcon({
      html: `
        <div style="
          background-color: #28a745;
          color: white;
          border-radius: 50%;
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">
          <i class="fa fa-map-marker-alt" style="font-size: 12px;"></i>
        </div>
      `,
      className: "delivery-marker",
      iconSize: [25, 25],
      iconAnchor: [12, 12],
    });

    // Crear o mover el marcador de entrega
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], {
        icon: deliveryIcon,
        draggable: true,
      }).addTo(this.map);

      // Agregar evento de arrastre al marcador
      this.marker.on("dragend", (e) => {
        const position = e.target.getLatLng();
        this._selectLocation(position.lat, position.lng);
      });
    }

    // Calcular distancia desde la tienda
    const distanceFromStore = this._calculateDistance(
      lat,
      lng,
      this.storeLat,
      this.storeLng
    );

    // Add popup to delivery marker with distance info
    this.marker.bindPopup(
      `
      <div style="text-align: center; padding: 5px;">
        <strong style="color: #28a745; font-size: 14px;">
          <i class="fa fa-map-marker-alt"></i> Punto de entrega
        </strong><br>
        <small style="color: #666;">
          <i class="fa fa-route"></i> Distancia desde ${this.storeName}: 
          <strong>${distanceFromStore.toFixed(2)} km</strong>
        </small>
      </div>
    `,
      {
        closeButton: false,
        className: "delivery-popup",
      }
    );

    // Actualizar estado
    this.locationSelected = true;
    this._updateCoordinates(lat, lng);

    // Mostrar indicador de carga en las instrucciones
    this._showLoadingInstructions();

    // Obtener dirección y actualizar campos
    await this._reverseGeocode(lat, lng);

    // Actualizar instrucciones
    this._updateMapInstructions();

    // Mostrar información de ubicación seleccionada con distancia
    this._showSelectedLocation(distanceFromStore);

    // Close store popup when delivery location is selected
    this.storeMarker.closePopup();
  },

  /**
   * Add instructions for map usage
   * @private
   */
  _addMapInstructions() {
    const instructionsDiv = document.createElement("div");
    instructionsDiv.id = "map_instructions";
    instructionsDiv.className = "alert alert-warning mb-3";
    instructionsDiv.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="fa fa-exclamation-triangle me-2"></i>
        <div>
          <strong>¡Selecciona tu ubicación de entrega!</strong><br>
          <small>
            El marcador rojo <i class="fa fa-store text-danger"></i> indica la ubicación de la tienda <strong>${this.storeName}</strong>.<br>
            Haz clic en el mapa o usa el botón "Usar mi ubicación actual" para marcar donde quieres recibir tu pedido.
          </small>
        </div>
      </div>
    `;

    const mapContainer = document.getElementById("delivery_map");
    mapContainer.parentNode.insertBefore(instructionsDiv, mapContainer);
  },

  /**
   * Show loading state in instructions
   * @private
   */
  _showLoadingInstructions() {
    const instructionsDiv = document.getElementById("map_instructions");
    if (instructionsDiv) {
      instructionsDiv.className = "alert alert-info mb-3";
      instructionsDiv.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="fa fa-spinner fa-spin me-2"></i>
          <div>
            <strong>Obteniendo información de la dirección...</strong><br>
            <small>Por favor espera mientras procesamos tu ubicación.</small>
          </div>
        </div>
      `;
    }
  },

  /**
   * Update map instructions based on selection status
   * @private
   */
  _updateMapInstructions() {
    const instructionsDiv = document.getElementById("map_instructions");
    if (instructionsDiv && this.locationSelected) {
      instructionsDiv.className = "alert alert-success mb-3";
      instructionsDiv.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="fa fa-check-circle me-2"></i>
          <div>
            <strong>¡Ubicación seleccionada correctamente!</strong><br>
            <small>Puedes arrastrar el marcador verde <i class="fa fa-map-marker-alt text-success"></i> para ajustar la posición exacta de entrega.</small>
          </div>
        </div>
      `;
    }
  },

  /**
   * Show selected location information
   * @private
   */
  _showSelectedLocation(distanceFromStore = null) {
    // Remover info anterior si existe
    const existingInfo = document.getElementById("selected_location_info");
    if (existingInfo) {
      existingInfo.remove();
    }

    if (this.selectedAddress) {
      const infoDiv = document.createElement("div");
      infoDiv.id = "selected_location_info";
      infoDiv.className = "alert alert-light border mb-3";

      let distanceInfo = "";
      if (distanceFromStore !== null) {
        const distanceColor =
          distanceFromStore > 5 ? "text-warning" : "text-success";
        distanceInfo = `
          <div class="mt-2 pt-2 border-top">
            <i class="fa fa-route ${distanceColor}"></i>
            <strong class="${distanceColor}">Distancia desde ${
          this.storeName
        }: ${distanceFromStore.toFixed(2)} km</strong>
            ${
              distanceFromStore > 5
                ? '<br><small class="text-muted"><i class="fa fa-info-circle"></i> Ubicación distante - verifica costos de envío</small>'
                : ""
            }
          </div>
        `;
      }

      infoDiv.innerHTML = `
        <div class="d-flex align-items-start">
          <i class="fa fa-map-marker-alt text-success me-2 mt-1"></i>
          <div class="flex-grow-1">
            <strong>Dirección de entrega seleccionada:</strong><br>
            <span class="text-muted">${this.selectedAddress}</span><br>
            <small class="text-info">
              <i class="fa fa-info-circle"></i>
              Coordenadas: ${this.marker
                .getLatLng()
                .lat.toFixed(6)}, ${this.marker.getLatLng().lng.toFixed(6)}
            </small>
            ${distanceInfo}
          </div>
        </div>
      `;

      const mapContainer = document.getElementById("delivery_map");
      mapContainer.parentNode.insertBefore(infoDiv, mapContainer.nextSibling);
    }
  },

  /**
   * Add a button to get current location
   * @private
   */
  _addLocationButton() {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "d-flex gap-2 mb-3 flex-wrap";

    const locationButton = document.createElement("button");
    locationButton.type = "button";
    locationButton.className = "btn btn-outline-primary";
    locationButton.innerHTML =
      '<i class="fa fa-location-arrow me-1"></i> Usar mi ubicación actual';
    locationButton.onclick = () => this._getCurrentLocation();

    const centerButton = document.createElement("button");
    centerButton.type = "button";
    centerButton.className = "btn btn-outline-secondary";
    centerButton.innerHTML =
      '<i class="fa fa-home me-1"></i> Centrar en Huaraz';
    centerButton.onclick = () => this._centerOnHuaraz();

    const storeButton = document.createElement("button");
    storeButton.type = "button";
    storeButton.className = "btn btn-outline-danger";
    storeButton.innerHTML = `<i class="fa fa-store me-1"></i> Ver tienda ${this.storeName}`;
    storeButton.onclick = () => this._centerOnStore();

    buttonContainer.appendChild(locationButton);
    buttonContainer.appendChild(centerButton);
    buttonContainer.appendChild(storeButton);

    const mapContainer = document.getElementById("delivery_map");
    mapContainer.parentNode.insertBefore(buttonContainer, mapContainer);
  },

  /**
   * Center map on Huaraz default location
   * @private
   */
  _centerOnHuaraz() {
    if (this.map) {
      this.map.setView([this.defaultLat, this.defaultLng], 14);
    }
  },

  /**
   * Center map on store location
   * @private
   */
  _centerOnStore() {
    if (this.map && this.storeMarker) {
      this.map.setView([this.storeLat, this.storeLng], 16);
      this.storeMarker.openPopup();
    }
  },

  /**
   * Get current location using browser geolocation
   * @private
   */
  _getCurrentLocation() {
    if (!navigator.geolocation) {
      alert("La geolocalización no es compatible con este navegador.");
      return;
    }

    const button = event.target;
    const originalHTML = button.innerHTML;
    button.innerHTML =
      '<i class="fa fa-spinner fa-spin me-1"></i> Obteniendo ubicación...';
    button.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Verificar si está cerca de Huaraz (radio de ~50km)
        const distance = this._calculateDistance(
          lat,
          lng,
          this.defaultLat,
          this.defaultLng
        );

        if (distance > 15) {
          const useAnyway = confirm(
            `Tu ubicación actual parece estar a ${Math.round(
              distance
            )}km de Huaraz. ` +
              `¿Deseas usarla de todas formas?\n\n` +
              `Haz clic en "Cancelar" para seleccionar manualmente en el mapa.`
          );

          if (!useAnyway) {
            button.innerHTML = originalHTML;
            button.disabled = false;
            return;
          }
        }

        this.map.setView([lat, lng], 16);
        this._selectLocation(lat, lng);

        button.innerHTML = originalHTML;
        button.disabled = false;
      },
      (error) => {
        console.error("Error getting location:", error);

        let errorMessage = "No se pudo obtener la ubicación actual.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación o selecciona manualmente en el mapa.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Información de ubicación no disponible. Por favor, selecciona manualmente en el mapa.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Tiempo de espera agotado. Por favor, selecciona manualmente en el mapa.";
            break;
        }

        alert(errorMessage);
        button.innerHTML = originalHTML;
        button.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  },

  /**
   * Calculate distance between two points in kilometers
   * @private
   */
  _calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Update coordinate fields
   * @private
   */
  _updateCoordinates(lat, lng) {
    const latField = document.getElementById("delivery_latitude");
    const lngField = document.getElementById("delivery_longitude");

    if (latField && lngField) {
      latField.value = lat.toFixed(7);
      lngField.value = lng.toFixed(7);
      console.log("Coordinates updated:", { latitude: lat, longitude: lng });
    }
  },

  /**
   * Reverse geocode to get address from coordinates
   * @private
   */
  async _reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es&zoom=18`,
        {
          headers: {
            "User-Agent": "OdooDeliveryApp/1.0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          this._updateAddressFields(data.address, data.display_name);
          this.selectedAddress = data.display_name;
        } else {
          this._setDefaultAddressFields();
        }
      } else {
        this._setDefaultAddressFields();
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      this._setDefaultAddressFields();
    }
  },

  /**
   * Update address fields with geocoded data
   * @private
   */
  _updateAddressFields(address, displayName) {
    // Construir dirección de manera inteligente
    let street = "";

    if (address.road) {
      street = address.road;
      if (address.house_number) {
        street += ` ${address.house_number}`;
      }
    } else if (address.neighbourhood || address.suburb) {
      street = address.neighbourhood || address.suburb;
    } else if (displayName) {
      street = displayName.split(",")[0] || "Ubicación seleccionada";
    } else {
      street = "Ubicación seleccionada en el mapa";
    }

    // Actualizar campos ocultos
    const streetField = document.getElementById("o_street");
    const cityField = document.getElementById("o_city");
    const zipField = document.getElementById("o_zip");
    const countryField = document.getElementById("o_country_id");

    if (streetField) streetField.value = street;
    if (cityField) {
      cityField.value = "Huaraz"; // Ciudad fija para Huaraz
    }
    if (zipField) {
      zipField.value = "02001";
    }
    if (countryField) {
      countryField.value = "173"; // ID de Perú en Odoo
    }

    console.log("Address fields updated:", {
      street: street,
      city: cityField ? cityField.value : "N/A",
      zip: zipField ? zipField.value : "N/A",
      country_id: "173",
    });
  },

  /**
   * Set default address fields when geocoding fails
   * @private
   */
  _setDefaultAddressFields() {
    const streetField = document.getElementById("o_street");
    if (streetField) streetField.value = "Ubicación seleccionada en el mapa";
    this.selectedAddress = "Ubicación seleccionada en Huaraz, Ancash, Perú";
  },

  /**
   * Show error message if map fails to load
   * @private
   */
  _showMapError() {
    const mapContainer = document.getElementById("delivery_map");
    mapContainer.innerHTML = `
      <div class="d-flex justify-content-center align-items-center h-100 text-muted">
        <div class="text-center p-4">
          <i class="fa fa-exclamation-triangle fa-3x mb-3 text-warning"></i>
          <h5>No se pudo cargar el mapa</h5>
          <p>Por favor, recarga la página e intenta nuevamente.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            <i class="fa fa-refresh me-1"></i> Recargar página
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Check initial phone value and update related fields if needed
   * @private
   */
  _checkInitialPhoneValue() {
    const phoneField = document.getElementById("o_phone");
    if (phoneField && phoneField.value) {
      // Si ya hay un valor en el teléfono, actualizar campos relacionados
      this._updateRelatedFields(phoneField.value);
    }
  },

  /**
   * Handle phone number change
   * @private
   */
  _onPhoneChange(ev) {
    const phone = ev.target.value || "";
    this._updateRelatedFields(phone);
    console.log("Phone number updated:", phone);
  },

  /**
   * Update related fields (email and vat) based on phone
   * @private
   */
  _updateRelatedFields(phone) {
    const emailField = document.getElementById("o_email");
    const vatField = document.getElementById("o_vat");

    if (emailField) {
      emailField.value = phone ? `${phone}@delivery.com` : "";
    }
    if (vatField) {
      vatField.value = phone;
    }
  },

  /**
   * Validate form before submission
   * @private
   */
  _validateForm() {
    const errors = [];

    // Verificar que se haya seleccionado una ubicación
    if (!this.locationSelected) {
      errors.push("Debes seleccionar tu ubicación de entrega en el mapa.");
    }

    // Verificar coordenadas
    const latField = document.getElementById("delivery_latitude");
    const lngField = document.getElementById("delivery_longitude");

    if (!latField || !lngField || !latField.value || !lngField.value) {
      errors.push("Las coordenadas de entrega no son válidas.");
    }

    // Verificar nombre
    const nameField = document.getElementById("o_name");
    if (!nameField || !nameField.value.trim()) {
      errors.push("El nombre completo es requerido.");
    }

    // Verificar teléfono
    const phoneField = document.getElementById("o_phone");
    if (!phoneField || !phoneField.value.trim()) {
      errors.push("El número de teléfono es requerido.");
    }

    return errors;
  },

  /**
   * Submit the form
   * @private
   */
  async _onSaveAddress(ev) {
    ev.preventDefault();

    // Validar formulario
    const validationErrors = this._validateForm();

    if (validationErrors.length > 0) {
      alert(
        "Por favor corrige los siguientes errores:\n\n• " +
          validationErrors.join("\n• ")
      );
      return;
    }

    const submitButton = ev.currentTarget;
    if (submitButton.disabled) {
      return;
    }

    // Mostrar estado de carga
    submitButton.disabled = true;
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML =
      '<i class="fa fa-spinner fa-spin me-1"></i> Procesando entrega...';

    try {
      const formData = new FormData(this.addressForm);

      // Agregar información adicional
      formData.append("location_selected_by_map", "true");
      formData.append(
        "selected_address_display",
        this.selectedAddress || "Ubicación en mapa"
      );

      // Agregar distancia desde la tienda si está disponible
      if (this.marker) {
        const deliveryLat = this.marker.getLatLng().lat;
        const deliveryLng = this.marker.getLatLng().lng;
        const distanceFromStore = this._calculateDistance(
          deliveryLat,
          deliveryLng,
          this.storeLat,
          this.storeLng
        );
        formData.append("distance_from_store", distanceFromStore.toFixed(2));
        formData.append("store_name", this.storeName);
      }

      // Huaraz
      const data = {
        l10n_pe_district: 85,
        city_id: 8,
        state_id: 1151,
        l10n_latam_identification_type_id: 5,
      };

      for (const key in data) {
        formData.append(key, data[key]);
      }

      const result = await this.http.post("/shop/address/submit", formData);

      console.log("Form submission result:", result);

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        // Manejar errores
        this._handleSubmissionErrors(result);

        // Restaurar botón
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error al procesar la entrega. Por favor, inténtalo de nuevo.");

      // Restaurar botón
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  },

  /**
   * Handle form submission errors
   * @private
   */
  _handleSubmissionErrors(result) {
    // Limpiar errores anteriores
    this.errorsDiv.innerHTML = "";

    // Mostrar mensajes de error
    if (result.messages && result.messages.length > 0) {
      const errorContainer = document.createElement("div");
      errorContainer.className = "alert alert-danger";

      const errorsList = document.createElement("ul");
      errorsList.className = "mb-0";

      result.messages.forEach((message) => {
        const listItem = document.createElement("li");
        listItem.textContent = message;
        errorsList.appendChild(listItem);
      });

      errorContainer.appendChild(errorsList);
      this.errorsDiv.appendChild(errorContainer);
    }

    // Resaltar campos inválidos
    document.querySelectorAll(".is-invalid").forEach((el) => {
      el.classList.remove("is-invalid");
    });

    if (result.invalid_fields) {
      result.invalid_fields.forEach((fieldName) => {
        const field =
          document.getElementById(`o_${fieldName}`) ||
          document.querySelector(`[name="${fieldName}"]`);
        if (field) {
          field.classList.add("is-invalid");
        }
      });
    }
  },

  /**
   * Clean up when widget is destroyed
   */
  destroy: function () {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
    this.storeMarker = null;
    this._super(...arguments);
  },
});

export default publicWidget.registry.websiteSaleMinimalAddress;
