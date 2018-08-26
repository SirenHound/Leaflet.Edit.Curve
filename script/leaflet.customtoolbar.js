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
      modeHandler.handler === modeHandler.handler || new modeHandler.Handler(map, modeHandler.enabled);
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
  }
});
