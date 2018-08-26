// Extending L.DrawToolbar
// Save original Class methods

L.CustomToolbar = L.DrawToolbar.extend({
  options:{
    customModes:[
      "Curve" // L.Draw.Curve
    ]
  },
  initialize: function(options){
    L.DrawToolbar.prototype.initialize.call(this, options);

    this.setModeHandlers(options.customModes);
  },
  createModeHandler: function(Handler){
    if (L.Draw[Handler]){
      var handler = Handler.toLowerCase();
      return {
        enabled: this.options[handler],
        Handler: L.Draw[Handler],
        title: L.drawLocal.draw.toolbar.buttons[handler]
      };
    }
  },
  setModeHandlers: function(customModes){
    this._modeHandlers = [
      "Polyline", "Polygon", "Rectangle", "Circle", "Marker", "CircleMarker"
    ].concat(customModes).filter(function(v){return v;}).map(this.createModeHandler, this);
  },
  getModeHandlers: function(map){
    return this._modeHandlers.map(function(modeHandler){
      // initialize handler from class
      modeHandler.handler = modeHandler.handler || new modeHandler.Handler(map, modeHandler.enabled);
      delete modeHandler.Handler;
      return modeHandler;
    }, this);
  },
  /** Add an already initialized handler to the toolbar
  */
  addCustomModeHandler: function (handler, title){
    this._modeHandlers.push({
      enabled: handler.options,
      handler: handler,
      title: title
    });
  },
  // @method addToolbar(map): L.DomUtil
  // Adds the toolbar to the map and returns the toolbar dom element
  addToolbar: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-draw-section'),
      buttonIndex = 0,
      buttonClassPrefix = this._toolbarClass || '',
      modeHandlers = this.getModeHandlers(map),
      i;

    this._toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
    this._map = map;

    for (i = 0; i < modeHandlers.length; i++) {
      if (modeHandlers[i].enabled) {
        this._initModeHandler(
          modeHandlers[i].handler,
          this._toolbarContainer,
          buttonIndex++,
          buttonClassPrefix,
          modeHandlers[i].title
        );
      }
    }

    // if no buttons were added, do not add the toolbar
    if (!buttonIndex) {
      return;
    }

    // Save button index of the last button, -1 as we would have ++ after the last button
    this._lastButtonIndex = --buttonIndex;

    // Create empty actions part of the toolbar
    this._actionsContainer = L.DomUtil.create('ul', 'leaflet-draw-actions');

    // Add draw and cancel containers to the control container
    container.appendChild(this._toolbarContainer);
    container.appendChild(this._actionsContainer);

    return container;
  },

});
