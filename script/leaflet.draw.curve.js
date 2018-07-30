// Requires L.Draw
L.Curve.prototype = L.extend({}, L.Polyline.prototype, L.Curve.prototype, {
	newPointIntersects:function(){
		return L.Polyline.prototype.newPointIntersects.apply(this, arguments);
	},
	_getProjectedPoints: function(){
		for (var t = [], e = this._poly.getLatLngs(), i = 0; i < e.length; i++)
                t.push(this._map.latLngToLayerPoint(e[i]));
 return t;
}
		
});
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

L.Draw.Curve = L.Draw.Polyline.extend({
	Poly: L.Curve,
	statics:{
		SUPPORTED_TYPES: ["M", "L", "H", "V", "C", "Q", "S", "T"]
	},
	options: {
		icon:new L.DivIcon({iconSize:new L.Point(8,8),className:"leaflet-div-icon leaflet-editing-icon"}),
		allowIntersection: true
	},
	initialize: function(map, options){
		L.Draw.Feature.prototype.initialize.call(this, map, options);
		this._markerGroup = new L.LayerGroup().addTo(map);
		this._markers = [];
		
		this.pointType = "M";
	},
	addHooks: function(){
		L.Draw.Feature.prototype.addHooks.call(this);
		this._poly=new this.Poly([],this.options.shapeOptions);
		if (this._map) {
			this._mapDraggable = this._map.dragging.enabled();
			if (this._mapDraggable){ this._map.dragging.disable(); }
			this._map._container.style.cursor="crosshair";
			this._tooltip.updateContent({text:this._initialLabelText});
			this._map.on("mousedown",this._onMouseDown,this);//.on("mousemove",this._onMouseMove,this);
		}
		//Until interface is figured out
		L.DomEvent.on(document, 'keydown', this._changePointType, this);
	},
	removeHooks: function(){
		L.Draw.Feature.prototype.removeHooks.call(this);
		
		//Until interface is figured out
		L.DomEvent.off(document, 'keydown', this._changePointType, this);
	},
	_changePointType: function(evt){
		var changeTo = evt.key.toUpperCase();
		if (L.Draw.Curve.SUPPORTED_TYPES.indexOf(changeTo) > -1 && this._markers.length){ // Must start with M
			this.pointType = changeTo;
		}
		else{
			console.warn("SVG point type '"+changeTo+"'is not supported or this is the first point and must not be changed from 'M'");
		}
		switch(changeTo){
			case "V":
				this._map._container.style.cursor="ns-resize";
				break;
			case "H":
				this._map._container.style.cursor="ew-resize";
				break;
			default:
				this._map._container.style.cursor="crosshair";
				break;
		}
	},
	// Will need to be a bit more versitile
	_createMarker:function(t){
		var e=new L.Marker(t, {icon: this.options.icon, zIndexOffset: 2*this.options.zIndexOffset});
		this._markerGroup.addLayer(e);
		return e;
	},
        _finishShape: function() {
            var t = this._poly._defaultShape ? this._poly._defaultShape() : this._poly.getLatLngs(),
		e = L.Polyline.prototype.newLatLngIntersects.call(this, t[t.length - 1]);
            return !this.options.allowIntersection && e || !this._shapeIsValid() ? void this._showErrorTooltip() : (this._fireCreatedEvent(),
            this.disable(),
            void (this.options.repeatMode && this.enable()))
        },
	_onMouseDown: function(evt) {

		var e=evt.originalEvent;
		this._mouseDownOrigin=L.point(e.clientX,e.clientY);

		this._isDrawing = !0;
		this._startLatLng = evt.latlng;
		//L.DomEvent.on(document, "mouseup", this._onMouseUp, this).preventDefault(evt.originalEvent);
		this._map.on("mouseup", this._onMouseUp, this);
		L.DomEvent.preventDefault(evt.originalEvent);
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
		var orgEvt = evt.originalEvent;
		if(this._mouseDownOrigin){ // SubClasses may define
			var pxDist = L.point(orgEvt.clientX, orgEvt.clientY)
				.distanceTo(this._mouseDownOrigin);
				
			if (Math.abs(pxDist)<9*(window.devicePixelRatio||1)){
				this.addVertex(evt.latlng);
			}
		}
		this._mouseDownOrigin=null;
		
		if (this._shape){ this._fireCreatedEvent(); }
		//this.disable();
		//if (this.options.repeatMode){ this.enable(); }
	},
	/** Adds a vertex (LatLng) to the object being drawn
	* @param {L.LatLng} latLng - the LatLng to add to the curve in construction
	*/
	addVertex:function(latLng){
		if (
			this._markers.length > 0 &&
			!this.options.allowIntersection &&
			this._poly.newLatLngIntersects(latLng)
		){
			this._showErrorTooltip();
		}
		else{
			if (this._errorShown) {
				this._hideErrorTooltip();
			}
			latLng = this.pointType === "V"? L.latLng(latLng.lat, this._markers[this._markers.length-1].getLatLng().lng) : this.pointType === "H"? L.latLng(this._markers[this._markers.length-1].getLatLng().lat, latLng.lng) : latLng;
			var newMarker = this._createMarker(latLng);
			this._markers.push(newMarker);
			
			//add latlng to path
			var path = this._poly.getPath();
			//probably need to have a look at the path to see if current type matches last used type, see how many points need adding etc.
			var instructions = path.filter(function(instr){return "string" === typeof instr;});
			var lastInstr = instructions[instructions.length-1];
			switch (this.pointType){
				case "M": case "L": case "T": //one point?
				/*	if (this.pointType !== lastInstr){ //bit sloppy, tighten up later
						path.push(this.pointType, [latLng.lat, latLng.lng]);
					}
					else{
						path.push([latLng.lat, latLng.lng]);
					}
				*/	break;
				case "H": case "V": //one point, but really like, half a point
					
					break;
				case "C": case "S":
					break;
				case "Q":
					break;
				
				if (this.pointType !== "C"||false) // do a % thing on number of points
				this._poly.setPath(path);
			
			}
			
				if (this.pointType !== lastInstr){ //bit sloppy, tighten up later
						path.push(this.pointType, [latLng.lat, latLng.lng]);
					}
					else{
						path.push([latLng.lat, latLng.lng]);
					}
				
			
			if (2===this._poly.getPath().length) {
//				this._map.addLayer(this._poly);
			}
			//this._vertexChanged(latLng, true);
			this.fire('vertexAdded', latLng);
		}
	},
	
});

}
