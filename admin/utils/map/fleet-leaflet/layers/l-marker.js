import Marker from '../../std/layers/marker'
import * as L from 'leaflet'
import markerSrc from '@/assets/icons/map/marker-icon.png'
import shadowSrc from '@/assets/icons/map/marker-shadow.png'

const L_MARKER_ICON = L.icon({
  iconUrl: markerSrc,
  shadowUrl: shadowSrc,
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [13, 41],
  shadowAnchor: [13, 41],
  popupAnchor: [-1, -27]
})

class LMarker extends Marker {
  create() {
    return this
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    this._lcmp = L.marker(this._getCompiledLatLng(), { icon: L_MARKER_ICON })
    this._lcmp.addTo(mapWrapper.mapCmp)
    return this
  }

  _updatePosition() {
    this._lcmp.setLatLng(this._getCompiledLatLng())
  }

  destroy() {
    this._lcmp.remove()
    super.destroy()
  }
}

export default LMarker
