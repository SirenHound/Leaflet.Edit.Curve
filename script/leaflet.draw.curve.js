// Requires L.Draw

/*Interface:

Once Enabled,
'click' (mousedown and mouseup within pixel tolerance):
	if first point or CtrlKey down:
		create 'M' (could be constrained from middleclick origin)
	if constrained:
		create 'V' or 'H' based on longer axis to cursor (should be already visualised)
	else:
		create 'L'
'middle click':
	constrain drawing vertex to longest axis between middleclick origin and cursor location
	
'drag'  (mousedown and mouseup outside of pixel tolerance):
  release any constraint
  if CtrlKey down:
	if first
	'C'


*/
if (L.Draw) {

L.Draw.Curve = L.Draw.Feature.extend({
	statics:{
		SUPPORTED_TYPES: ["M", "L", "H", "V", "C", "Q", "S", "T"]
	},
	initialize: function(map, options){
		L.Draw.Feature.prototype.initialize.call(this, map, options);
		this.pointType = "M";
	},
	addHooks: function(){
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._mapDraggable = this._map.dragging.enabled();
			if (this._mapDraggable){ this._map.dragging.disable(); }
			this._container.style.cursor="crosshair";
			this._tooltip.updateContent({text:this._initialLabelText});
			this._map.on("mousedown",this._onMouseDown,this).on("mousemove",this._onMouseMove,this);
		}
		
		//L.DomEvent.on(document, 'keydown', this._changePointType, this);
	},
	removeHooks: function(){
		L.Draw.Feature.prototype.removeHooks.call(this);
		
		//L.DomEvent.off(document, 'keydown', this._changePointType, this);
	},
	_changePointType: function(evt){
		var changeTo = evt.key.toUpperCase();
		if (L.Draw.Curve.SUPPORTED_TYPES.contains(changeTo)){
			this.pointType = changeTo;
		}
		else{
			console.warn("SVG point type '"+changeTo+"'is not supported");
		}
	},
	_onMouseDown: function(evt) {
		this._isDrawing = !0;
		this._startLatLng = evt.latlng;
		L.DomEvent.on(document, "mouseup", this._onMouseUp, this).preventDefault(evt.originalEvent);
	},
	
	/** Updates the shape being drawn using the current mouse position
	* @param {LeafletMouseEvent} evt - See {@link http://leafletjs.com/reference.html#mouse-event }
	*/
	_onMouseMove: function(evt) {
		var e = evt.latlng;
		this._tooltip.updatePosition(e);
		if (this._isDrawing) {
			this._tooltip.updateContent({
				text: this._endLabelText
			});
			this._drawShape(e);
		}
	},
	// Finishing a point defined by a line that was dragged out (eg. C or Q)
	// Taken from SimpleShape handler.
	_onMouseUp: function(evt){
		if (this._shape){ this._fireCreatedEvent(); }
		//this.disable();
		//if (this.options.repeatMode){ this.enable(); }
	},
	
});

}