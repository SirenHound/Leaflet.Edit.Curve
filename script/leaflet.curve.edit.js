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
  getTypedMarkers: function(){
    var markers = [];
    var icons = {
      qControl: new L.DivIconStyled({backgroundColor: 'yellow'})
    };
    
    this._coords.forEach(function(coord, i, coords){
      if ("string" === typeof coord){
        switch (coord){
          case "Q":// Quadratic has 2 coords
          markers.push(new L.Marker(coords[i+1], {type: "control1", icon: icons.qControl}));
        }
      }
    });
    return markers;
  }

});
