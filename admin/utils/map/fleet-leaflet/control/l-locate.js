import * as L from 'leaflet'
import Locate from '../../std/control/locate'
import { UxPanel } from './l-panel'
import DataUtil from '../../std/util/data-util'
import * as d3 from 'd3'
import SYSTEM_CONFIG from '../../std/util/system-config'

const BMap = window.BMap

const BAIDU_GEO_LEVEL = {
  '省': 8,
  '城市': 12,
  '区县': 14,
  '村庄': 16,
  '商务大厦': 17
}

const L_MARKER_ICON = L.icon({
  iconUrl: '../../../icons/map/marker-icon.png',
  shadowUrl: '../../../icons/map/marker-shadow.png',
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [13, 41],
  shadowAnchor: [13, 41],
  popupAnchor: [-1, -27]
})

var UxLocate = UxPanel.extend({

})

export default class LLocate extends Locate {
  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxLocate(me.options)
    me.on('hide', function(e) {
      me._cleanLocatedItem()
    }, me)
    return me
  }

  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    this._lcmp.addTo(mapWrapper.mapCmp)
    this._bindEvent()
    return this
  }
  getContainerElement() {
    return this._lcmp.el
  }
  onRemove() {
    this.mapWrapper.removeControl(this._lcmp)
    this._cleanLocatedItem()
    this._unbindEvent()
    super.onRemove()
  }
  search(location) {
    const me = this
    const myGeo = new BMap.Geocoder()
    const coord = me._isCoordinate(location)
    const map = me.mapWrapper.mapCmp
    let latLng
    let displayLatLng
    if (coord) {
      const srcCrsCode = SYSTEM_CONFIG.CRS_CODE
      const bdCrsCode = DataUtil.Coordinate.BD09
      const destCrsCode = map.options.crs.code
      const bdLatLng = DataUtil.transform(coord.lat, coord.lng, srcCrsCode, bdCrsCode)

      // 根据坐标得到地址描述
      myGeo.getLocation(new BMap.Point(bdLatLng.lng, bdLatLng.lat), function(result) {
        if (result && result.address) {
          me._location = result.address
          me._locationLevel = me._getSuitableMapLevel(result.addressComponents)
        } else {
          me._location = locales.locate.unknownPlace
          me._locationLevel = 17
        }
        latLng = DataUtil.transform(coord.lat, coord.lng, srcCrsCode, destCrsCode)
        me._updateMarker({ latLng: latLng, displayLatLng: coord }, true)
      })
    } else {
      // 根据地址描述得到坐标
      myGeo.getPoint(location, function(point, info) {
        if (point) {
          me._location = location
          me._locationLevel = info.level
          const srcCrsCode = DataUtil.Coordinate.BD09
          const destCrsCode = map.options.crs.code
          // 根据系统设置的坐标系显示
          const displayCrsCode = SYSTEM_CONFIG.CRS_CODE
          latLng = DataUtil.transform(point.lat, point.lng, srcCrsCode, destCrsCode)
          displayLatLng = DataUtil.transform(point.lat, point.lng, srcCrsCode, displayCrsCode)
        } else {
          me._invalidSearch()
        }
        me._updateMarker({ latLng: latLng, displayLatLng: displayLatLng }, true)
      }, location)
    }
  }
  _bindEvent() {
    const me = this
    const map = me.mapWrapper.mapCmp
    map.on('crschange', me._transformCoords, me)
  }
  _unbindEvent() {
    const me = this
    const map = me.mapWrapper.mapCmp
    map.off('crschange', me._transformCoords, me)
  }
  _transformCoords(e) {
    const me = this
    if (!me.locatedItem) return
    // 底图改变后根据坐标系更新坐标
    const srcLatLng = me.locatedItem.getLatLng()
    const destLatLng = DataUtil.transform(srcLatLng.lat, srcLatLng.lng, e.oldCrs.code, e.newCrs.code)
    me._updateMarker({ latLng: destLatLng, displayLatLng: me.locatedItem._displayLatLng }, false)
  }
  _updateMarker(coordinate, center) {
    const me = this
    if (me.locatedItem) me.locatedItem.remove()
    if (!coordinate) return
    const map = me.mapWrapper.mapCmp
    const popup = L.popup({ closeOnClick: false }).setContent(
      `<div>
        <div><span>${locales.locate.place}: </span><span>${me._location}</span></div>
        <div><span>${locales.locate.longitude}: </span><span>${coordinate.displayLatLng.lng}</span></div>
        <div><span>${locales.locate.latitude}: </span><span>${coordinate.displayLatLng.lat}</span></div>
      </div>`
    )
    me.locatedItem = L.marker(coordinate.latLng, {
      icon: L_MARKER_ICON
    }).bindPopup(popup).addTo(map).openPopup()
    me.locatedItem._displayLatLng = coordinate.displayLatLng
    if (center) map.setView(coordinate.latLng, BAIDU_GEO_LEVEL[me._locationLevel] || 17)
  }
  _getSuitableMapLevel(addressCmps) {
    if (!addressCmps.streetNumber) return BAIDU_GEO_LEVEL['商务大厦']
    if (!addressCmps.street) return BAIDU_GEO_LEVEL['村庄']
    if (!addressCmps.district) return BAIDU_GEO_LEVEL['区县']
    if (!addressCmps.city) return BAIDU_GEO_LEVEL['城市']
    if (!addressCmps.province) return BAIDU_GEO_LEVEL['省份']
  }
  _invalidSearch() {
    const me = this

    delete me._location
    delete me._locationLevel

    const inputEl = me._getInputEl()
    if (inputEl) {
      d3.select(inputEl)
        .style('background', '#ff0000')
        .transition()
        .ease(d3.easeLinear)
        .duration(1500)
        .style('background', '#ffffff')
    }
  }
  _cleanLocatedItem() {
    const me = this
    if (me.locatedItem) {
      me.locatedItem.remove()
      delete me.locatedItem
    }
  }
}
