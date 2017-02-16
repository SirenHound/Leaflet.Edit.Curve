L.DraggableH = L.Draggable.extend({
	_onMove: function(i) {
		if (!i._simulated && this._enabled) {
			if (i.touches && i.touches.length > 1)
				return void (this._moved = !0);
			var n = i.touches && 1 === i.touches.length ? i.touches[0] : i
			  , /*s = new L.Point(n.clientX,n.clientY); */ r = new L.Point(n.clientX - this._startPoint.x, -this._startPoint.y);
			 // s.x = s.x - this._startPoint.x;
			 // r = s; //s.subtract(this._startPoint);
			(r.x || r.y) && (Math.abs(r.x) + Math.abs(r.y) < this.options.clickTolerance || (L.DomEvent.preventDefault(i),
			this._moved || (this.fire("dragstart"),
			this._moved = !0,
			this._startPos = L.DomUtil.getPosition(this._element).subtract(r),
			L.DomUtil.addClass(document.body, "leaflet-dragging"),
			this._lastTarget = i.target || i.srcElement,
			t.SVGElementInstance && this._lastTarget instanceof SVGElementInstance && (this._lastTarget = this._lastTarget.correspondingUseElement),
			L.DomUtil.addClass(this._lastTarget, "leaflet-drag-target")),
			this._newPos = this._startPos.add(r),
			this._moving = !0,
			L.Util.cancelAnimFrame(this._animRequest),
			this._lastEvent = i,
			this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, !0)))
		}
	},
	_updatePosition: function() {
		var t = {
			originalEvent: this._lastEvent
		};
		this.fire("predrag", t),
		L.DomUtil.setPosition(this._element, this._newPos),
		this.fire("drag", t)
	},
	_onUp: function(t) {
		if (!t._simulated && this._enabled) {
			L.DomUtil.removeClass(document.body, "leaflet-dragging"),
			this._lastTarget && (L.DomUtil.removeClass(this._lastTarget, "leaflet-drag-target"),
			this._lastTarget = null);
			for (var i in L.Draggable.MOVE)
				L.DomEvent.off(document, L.Draggable.MOVE[i], this._onMove, this).off(document, L.Draggable.END[i], this._onUp, this);
			L.DomUtil.enableImageDrag(),
			L.DomUtil.enableTextSelection(),
			this._moved && this._moving && (L.Util.cancelAnimFrame(this._animRequest),
			this.fire("dragend", {
				distance: this._newPos.distanceTo(this._startPos)
			})),
			this._moving = !1,
			L.Draggable._dragging = !1
		}
	}
});

L.Handler.MarkerDragH = L.Handler.MarkerDrag.extend({
	addHooks: function() {
		var t = this._marker._icon;
		this._draggable || (this._draggable = new L.DraggableH(t,t,!0)),
		this._draggable.on({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).enable(),
		L.DomUtil.addClass(t, "leaflet-marker-draggable")
	},
	removeHooks: function() {
		this._draggable.off({
			dragstart: this._onDragStart,
			drag: this._onDrag,
			dragend: this._onDragEnd
		}, this).disable(),
		this._marker._icon && L.DomUtil.removeClass(this._marker._icon, "leaflet-marker-draggable")
	},
	_onDrag: function(t) {
		var e = this._marker
		  , i = e._shadow
		  , n = L.DomUtil.getPosition(e._icon)
		  , s = e._map.layerPointToLatLng(n);
		i && L.DomUtil.setPosition(i, n),
		e._latlng = s,
		t.latlng = s,
		t.oldLatLng = this._oldLatLng,
		e.fire("move", t).fire("drag", t)
	}
});


L.DivIconStyled = L.DivIcon.extend({
  createIcon: function(){
    var r = L.DivIcon.prototype.createIcon.apply(this);
    for (var styleOption in this.options.styleOptions){
      r.style[styleOption] = this.options.styleOptions[styleOption];
    }//.backgroundColor = "yellow";
    return r;
  }
});

L.Curve.include({
  getLatLngs: function(){
    return this._coords.filter(function(coord){
      return Array.isArray(coord);
    }).map(function(coord){
      return L.latLng(coord);
    });
  },
  /** Create markers from the points defining this curve and assign them as types
  */
  getTypedMarkers: function (){
    var icons = {
      qControl: new L.DivIconStyled({styleOptions:{backgroundColor: 'yellow'}}),
      cControl1: new L.DivIconStyled({styleOptions:{backgroundColor: 'yellow'}}),
      cControl2: new L.DivIconStyled({styleOptions:{backgroundColor: 'orange'}}),
      vAnchor: new L.DivIconStyled({html: '\u21D5', styleOptions:{cursor: 'ns-resize', backgroundColor: 'lightblue'}}),
      hAnchor: new L.DivIconStyled({html: '\u21D4', styleOptions:{cursor: 'ew-resize', backgroundColor: 'pink'}})
    };
    
	var prev;
	var layers = [];
	var runSwitch = function(coord, i, coords){
		var markers = [];
		var guiLayers = [];
		switch (coord){
			case "M": case "L": // Single point
				markers.push(new L.Marker(coords[i+1], {type: "anchor", icon: new L.DivIcon()}));
				break;
			case "V":
				var backBy = 1; // How far back to look for the other half of the coordinate
				switch (prev) {
					case "M": case "L":
					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][1]], {type: "anchor", icon: icons.vAnchor}));
					break;
					case "V":// Need to go back further! \21D4
//					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][0]], {type: "anchor", icon: icons.vAnchor}));
					break;
					case "H":
					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][0]], {type: "anchor", icon: icons.vAnchor}));
					break;
					default:
					markers.push(new L.Marker([coords[i+1][0], coords[i-backBy][1]], {type: "anchor", icon: icons.vAnchor}));
				}
				break;
			case "H":
				var backBy = 1; // How far back to look for the other half of the coordinate
				switch (prev) {
					case "M": case "L":
						markers.push(new L.Marker([coords[i-backBy][0], coords[i+1][0]], {type: "anchor", icon: icons.hAnchor}));
						break;
					case "V":
						markers.push(new L.Marker([coords[i-backBy][0], coords[i+1][0]], {type: "anchor", icon: icons.hAnchor}));
						break;
					case "H":// Need to go back further!
						break;
					default:
						markers.push(new L.Marker([coords[i-backBy][0], coords[i+1][0]], {type: "anchor", icon: icons.hAnchor}));
				}
				break;
			case "Q":// Quadratic has 2 coords
				markers.push(new L.Marker(coords[i+1], {type: "control1", icon: icons.qControl}));
				markers.push(new L.Marker(coords[i+2], {type: "anchor", icon: new L.DivIcon()}));
				guiLayers.push(new L.Polyline([coords[i-1], coords[i+1]], {color: 'yellow'}));
				guiLayers.push(new L.Polyline([coords[i+1], coords[i+2]], {color: 'yellow'}));
				break;
			case "C":// Cubic has 3 coords
				markers.push(new L.Marker(coords[i+1], {type: "control1", icon: icons.cControl1}));
				markers.push(new L.Marker(coords[i+2], {type: "control1", icon: icons.cControl2}));
				markers.push(new L.Marker(coords[i+3], {type: "anchor", icon: new L.DivIcon()}));
				// first coord works with previous point. coords has already calculated point from partials (V, H)
				guiLayers.push(new L.Polyline([coords[i-1], coords[i+1]], {color: 'yellow'}));
				guiLayers.push(new L.Polyline([coords[i+2], coords[i+3]], {color: 'yellow'}));
				break;
			case "S":// S is shortcut C. Will fail following M L V H
				var reflCoord = [2*coords[i-1][0] - coords[i-2][0], 2*coords[i-1][1] - coords[i-2][1]];
				markers.push(new L.Marker(reflCoord, {type: "control1", icon: icons.cControl1}));
				markers.push(new L.Marker(coords[i+1], {type: "control1", icon: icons.cControl2}));
				markers.push(new L.Marker(coords[i+2], {type: "anchor", icon: new L.DivIcon()}));
				// first coord works with previous point. coords has already calculated point from partials (V, H)
				guiLayers.push(new L.Polyline([coords[i-2], reflCoord], {color: 'yellow'}));
				guiLayers.push(new L.Polyline([coords[i+2], coords[i+3]], {color: 'yellow'}));
				break;
		}
		return markers.concat(guiLayers);
	};
	
	var coords = this._coords;
	for (var i = 0; i < coords.length;i++){
	//this._coords.forEach(function(coord, i, coords){
		var coord = coords[i];
		
		if ("string" === typeof coord){

			layers = layers.concat(runSwitch(coord, i, coords));
			switch (coord){
			case "M": case "L": case "V": case "H": // Single point (or Array)
				i++;
				break;
			case "S": case "Q":// 2 coords
				i += 2;
				break;
			case "C":// 3 coords
				i += 3;
				break;
			default:
				i++;
			}
			
			prev = coord;
		}
		else{
			layers = layers.concat(runSwitch(prev, i-1, coords));
			switch (prev){
			case "M": case "L": case "V": case "H": // Single point (or Array)
				i++;
				break;
			case "S": case "Q":// 2 coords
				i += 2;
				break;
			case "C":// 3 coords
				i += 3;
				break;
			default:
				i++;
			}
			
		}
	}
    return layers; //markers.concat(guiLayers);
  }

});

