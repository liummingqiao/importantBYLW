import CoordPicker from '../../std/control/coord-picker'
import { UxPanel } from './l-panel'
import DataUtil from '../../std/util/data-util'
import SYSTEM_CONFIG from '../../std/util/system-config'
import { DomUtil } from '../../std/util/dom-util'

const L = window.L

const L_MARKER_ICON = L.icon({
  iconUrl: '/static/icons/map/marker-icon.png',
  shadowUrl: '/static/icons/map/marker-shadow.png',
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [13, 41],
  shadowAnchor: [13, 41],
  popupAnchor: [-1, -27]
})

var UxCoordPicker = UxPanel.extend({
  onAdd(map) {
    UxPanel.prototype.onAdd.call(this, map)
    const me = this
    map.on('crschange', me._transformCoords, me)
    return me.el
  },
  onRemove(map) {
    const me = this
    UxPanel.prototype.onRemove.call(me, map)
    if (me._pickedCoord) me._pickedCoord.remove()
    me.disable()
    map.off('crschange', me._transformCoords, me)
  },
  enable: function() {
    const me = this
    const map = me._map
    DomUtil.addClass(map._container, 'fm-coord-picker-active')
    map.on('click', me._onMapClick, me)
  },
  disable: function() {
    const me = this
    const map = me._map
    DomUtil.removeClass(map._container, 'fm-coord-picker-active')
    map.off('click', me._onMapClick, me)
  },
  _onMapClick: function(e) {
    const me = this
    const map = me._map
    const wrapper = me._wrapper
    if (me._pickedCoord) me._pickedCoord.remove()
    me._pickedCoord = L.marker(e.latlng, {
      icon: L_MARKER_ICON
    }).addTo(map)

    const srcCrsCode = map.options.crs.code
    const destCrsCode = SYSTEM_CONFIG.CRS_CODE

    const destLatLng = DataUtil.transform(e.latlng.lat, e.latlng.lng, srcCrsCode, destCrsCode)

    wrapper.updateCoord({ lat: destLatLng.lat, lng: destLatLng.lng })

    me.disable()
  },
  _transformCoords: function(e) {
    const me = this
    // 底图改变后根据坐标系更新坐标
    if (me._pickedCoord) {
      const latLng = me._pickedCoord.getLatLng()
      const destLatLng = DataUtil.transform(latLng.lat, latLng.lng, e.oldCrs.code, e.newCrs.code)

      me._pickedCoord.setLatLng(destLatLng)
    }
  }
})

export default class LCoordPicker extends CoordPicker {
  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxCoordPicker(me.options)
    me._lcmp._wrapper = me
    me.on('hide', function(e) {
      me._lcmp.disable()
      if (me._lcmp._pickedCoord) me._lcmp._pickedCoord.remove()
      me._coordEl.value = ''
    }, me)
    return me
  }

  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    this._lcmp.addTo(mapWrapper.mapCmp)
    return this
  }

  getContainerElement() {
    return this._lcmp.el
  }

  onRemove() {
    this.mapWrapper.removeControl(this._lcmp)
    super.onRemove()
  }

  _onPickBtnClick(event) {
    super._onPickBtnClick(event)
    const me = this
    me._lcmp.enable()
  }
}
