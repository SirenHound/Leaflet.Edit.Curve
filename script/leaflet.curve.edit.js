
L.Curve.include({
  getLatLngs: function(){
    return this._coords.filter(function(coord){
      return Array.isArray(coord);
    }).map(function(coord){
      return L.latLng(coord);
    });
  }
});
