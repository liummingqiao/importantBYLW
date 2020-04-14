
import GoogleStreet from '../../std/control/google-street'
import LTileLayer from '../layers/tilelayers/l-tile-layer'
import * as L from 'leaflet'
import { UxPanel } from './l-panel'
import { RotateMarker } from './l-baidu-street'

export default class LGoogleStreet extends GoogleStreet {
  markerAppended = false
  trakcerVisible = true
  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxPanel(me.options)
    return me
  }
  _updateMarker(position) {
    if (!this.markerAppended) {
      this._lmarker = new RotateMarker([position.lat, position.lng], {
        opacity: 1,
        rotate: position.heading,
        interactive: false,
        bubblingMouseEvents: true,
        icon: L.icon({
          iconUrl: this.options.markerIcon,
          iconSize: [128, 128],
          iconAnchor: [64, 64]
        })
      }).addTo(this.mapWrapper.mapCmp)
      this._lmarker._icon.style.transformOrigin = 'center center'
      this.markerAppended = true
    } else {
      this._lmarker.setRotate(position.heading)
      this._lmarker.setLatLng([position.lat, position.lng])
    }
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    this._lcmp.addTo(mapWrapper.mapCmp)
    return this
  }
  getContainerElement() {
    return this._lcmp.el
  }
  showTracker() {
    if (this.panoValid && this._lmarker) {
      this._lmarker._icon.style.display = ''
    }
    this.trackerVisible = true
  }
  hideTracker() {
    if (this.panoValid && this._lmarker) {
      this._lmarker._icon.style.display = 'none'
    }
    this.trackerVisible = false
  }
  destroy() {
    this.mapWrapper.removeControl(this._lcmp)
    if (this.markerAppended) {
      this.mapWrapper.mapCmp.remove(this._lmarker)
    }
    this.onRemove()
  }
  onRemove() {
    super.onRemove()
  }
  tileLayer
  getStreetTile() {
    if (this.tileLayer) {
      return this.tileLayer
    } else {
      this.tileLayer = new LTileLayer({
        tile: `google.streetonly`
      }).create()

      return this.tileLayer
    }
  }
}
