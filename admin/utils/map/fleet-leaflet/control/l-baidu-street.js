
import BaiduStreet from '../../std/control/baidu-street'
import LTileLayer from '../layers/tilelayers/l-tile-layer'
import { DomUtil } from '../../std/util/dom-util'
import * as L from 'leaflet'
import { UxPanel } from './l-panel'

// const SCALE = [1.0, 0.75, 0.5, 0.5, 0.5,
//   0.5, 0.5, 0.5, 0.5, 0.5,
//   0.5, 0.5, 0.5, 0.5, 0.5,
//   0.5, 0.5, 0.5, 0.5, 0.5]

export const RotateMarker = L.Marker.extend({
  setScale(scale) {
    this.options.scale = scale
  },
  setRotate(rotate) {
    this.options.rotate = rotate
  },
  _setPos: function(pos) {
    // this.setScale(SCALE[this._map.getMaxZoom() - this._map.getZoom()])
    this.setScale(1)

    if (this._icon) {
      DomUtil.setPosition(this._icon, pos, this.options.scale, this.options.rotate)
    }

    if (this._shadow) {
      DomUtil.setPosition(this._shadow, pos, this.options.scale, this.options.rotate)
    }

    this._zIndex = pos.y + this.options.zIndexOffset

    this._resetZIndex()
  }
})

export default class LBaiduStreet extends BaiduStreet {
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
  tileLayer
  getStreetTile() {
    if (this.tileLayer) {
      return this.tileLayer
    } else {
      this.tileLayer = new LTileLayer({
        tile: `baidu.streetonly`
      }).create()

      return this.tileLayer
    }
  }

  onRemove() {
    super.onRemove()
  }
}
