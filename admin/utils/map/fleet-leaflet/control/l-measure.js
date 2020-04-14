import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import Measure from '../../std/control/measure'
import { UxPanel } from './l-panel'
import DataUtil from '../../std/util/data-util'

const L = window.L

Object.assign(L.drawLocal, {
  draw: {
    handlers: {
      polygon: {
        tooltip: {
          start: locales.measure.polygon.tooltip.start,
          cont: locales.measure.polygon.tooltip.cont,
          end: locales.measure.polygon.tooltip.end
        }
      },
      polyline: {
        error: locales.measure.polyline.error,
        tooltip: {
          start: locales.measure.polyline.tooltip.start,
          cont: locales.measure.polyline.tooltip.cont,
          end: locales.measure.polyline.tooltip.end
        }
      }
    }
  }
})

const LEAFLET_DRAW_MODE = 'measure'

// 测量样式
const MEASURE_COLOR = '#1890ff'
const MEASURE_PATH_WEIGHT = 2
const MEASURE_PATH_OPACITY = 1.0
const MEASURE_FILL_COLOR = '#1890ff'
const MEASURE_FILL_OPACITY = 0.3

var UxMeasure = UxPanel.extend({
  onAdd: function(map) {
    const me = this

    UxPanel.prototype.onAdd.call(me, map)

    me.measureItems = new L.FeatureGroup()
    me._tempTips = []
    me._tipsLayerGroup = new L.FeatureGroup()
    map.addLayer(me.measureItems)
    map.addLayer(me._tipsLayerGroup)
    me._polylineDrawer = new L.Draw.Polyline(map, {
      shapeOptions: {
        color: MEASURE_COLOR,
        weight: MEASURE_PATH_WEIGHT,
        opacity: MEASURE_PATH_OPACITY
      }
    })
    me._polygonDrawer = new L.Draw.Polygon(map, {
      allowIntersection: false,
      showArea: true,
      metric: ['km', 'm'],
      shapeOptions: {
        color: MEASURE_COLOR,
        weight: MEASURE_PATH_WEIGHT,
        opacity: MEASURE_PATH_OPACITY,
        fillColor: MEASURE_FILL_COLOR,
        fillOpacity: MEASURE_FILL_OPACITY
      }
    })
    me._bindEvent()
    return me.el
  },
  onRemove: function(map) {
    const me = this
    UxPanel.prototype.onRemove.call(me, map)
    me.measureItems.remove()
    me._tipsLayerGroup.remove()
    me._unbindEvent()
  },
  _bindEvent: function() {
    const me = this
    const map = me._map
    map.on(L.Draw.Event.DRAWVERTEX, me._onDrawVertex, me)
      .on(L.Draw.Event.CREATED, me._onDrawCreated, me)
      .on('crschange', me._transformCoords, me)
  },
  _unbindEvent: function() {
    const me = this
    const map = me._map
    map.off(L.Draw.Event.DRAWVERTEX, me._onDrawVertex, me)
      .off(L.Draw.Event.CREATED, me._onDrawCreated, me)
      .off('crschange', me._transformCoords, me)
  },
  _onDrawVertex: function(e) {
    const me = this
    const map = me._map
    if (map._ld_apply_to === LEAFLET_DRAW_MODE) {
      if (me.currentDrawer && me.currentDrawer.type === 'polyline') {
        const markerGroup = e.layers
        const markers = markerGroup.getLayers()
        if (markers.length > 0) {
          const lastMarker = markers[markers.length - 1]
          const position = lastMarker.getLatLng()
          const tip = me._createTooltip(position)
          if (markers.length === 1) {
            tip._icon.innerHTML = '<div class="fm-measure-tooltip-total">' + locales.measure.start + '</div>'
          } else if (markers.length === 2) {
            tip._icon.innerHTML = '<div class="fm-measure-tooltip-total">' + me._getTotoalDistanceText(markers.map(marker => marker.getLatLng())) + '</div>'
          } else {
            const preLastMarker = markers[markers.length - 2]
            let tipText = '<div class="fm-measure-tooltip-total">' + me._getTotoalDistanceText(markers.map(marker => marker.getLatLng())) + '</div>'
            tipText += '<div class="fm-measure-tooltip-difference">' + me._getDistanceDiffText(preLastMarker.getLatLng(), lastMarker.getLatLng()) + '</div>'
            tip._icon.innerHTML = tipText
          }
          me._tempTips.push(tip)
        }
      }
    }
  },
  _onDrawCreated: function(e) {
    const me = this
    const map = me._map
    if (map._ld_apply_to === LEAFLET_DRAW_MODE) {
      const layer = e.layer
      me.measureItems.addLayer(layer)
      layer.layerType = e.layerType
      if (layer.layerType !== 'polyline') {
        const position = layer.getCenter()
        const tip = me._createTooltip(position)
        const latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs()
        const area = L.GeometryUtil.geodesicArea(latlngs)
        tip._icon.innerHTML = '<div class="fm-measure-tooltip-total">' + me._getReadableArea(area) + '</div>'
        me._tempTips.push(tip)
      } else {
        const lastTip = me._tempTips[me._tempTips.length - 1]
        const latLngs = layer.getLatLngs()
        if (latLngs.length < 2) return
        const preLastLatLng = latLngs[latLngs.length - 2]
        const lastLatLng = latLngs[latLngs.length - 1]
        let tipText = '<div class="fm-measure-tooltip-total">' + locales.measure.total + ': ' + me._getTotoalDistanceText(layer.getLatLngs()) + '</div>'
        if (latLngs.length > 2) tipText += '<div class="fm-measure-tooltip-difference">' + me._getDistanceDiffText(preLastLatLng, lastLatLng) + '</div>'
        lastTip._icon.innerHTML = tipText
      }
      layer._tips = me._tempTips
      me._tempTips = []
      me._wrapper.fire('endmeasure')
    }
  },
  _getTotoalDistanceText: function(latLngs) {
    // 单位 - 米
    let distance = 0
    for (let i = 0; i < latLngs.length - 1; i++) {
      distance += latLngs[i].distanceTo(latLngs[i + 1])
    }
    return this._getReadableLength(distance)
  },
  _onZoomEnd: function(e) {
    const me = this
    me.measureItems.eachLayer(layer => {
      (layer._tips || []).forEach(function(tip) {
        tip.updatePosition(tip._latLng)
      })
    })
    me._tempTips.forEach(tip => {
      tip.updatePosition(tip._latLng)
    })
  },
  _getDistanceDiffText: function(start, end) {
    // 单位 - 米
    const distance = start.distanceTo(end)
    return `(+${this._getReadableLength(distance)})`
  },
  _getReadableLength: function(distance) {
    // distance的单位 - 米
    let distanceText
    if (distance < 1000) {
      distanceText = Math.round(distance) + ' ' + locales.measure.meter
    } else {
      distanceText = (distance / 1000).toFixed(2) + ' ' + locales.measure.kilometer
    }
    return distanceText
  },
  _getReadableArea: function(area) {
    // area的单位 - 平方米
    let areaText
    if (area < 100000) {
      areaText = Math.round(area) + ' ' + locales.measure.sqmeter
    } else {
      areaText = (area / 1000000).toFixed(2) + ' ' + locales.measure.sqkilometer
    }
    return areaText
  },
  _transformCoords: function(e) {
    const me = this
    // 底图改变后根据坐标系更新坐标
    me.measureItems.eachLayer(layer => {
      const layerType = layer.layerType
      const srcLatLngs = layer.getLatLngs()
      const tips = layer._tips
      let destLatLngs

      (tips || []).forEach(tip => {
        const latLng = tip.getLatLng()
        const destLatLng = DataUtil.transform(latLng.lat, latLng.lng, e.oldCrs.code, e.newCrs.code)
        tip.setLatLng(destLatLng)
      })

      if (layerType === 'polyline') {
        destLatLngs = srcLatLngs.map(latLng => DataUtil.transform(latLng.lat, latLng.lng, e.oldCrs.code, e.newCrs.code))
      } else {
        destLatLngs = srcLatLngs.map(latLngs => latLngs.map(latLng => DataUtil.transform(latLng.lat, latLng.lng, e.oldCrs.code, e.newCrs.code)))
      }
      layer.setLatLngs(destLatLngs)
      layer.redraw()
    })
  },

  _createTooltip: function(position) {
    const icon = L.divIcon({
      className: 'fm-measure-tooltip',
      iconAnchor: [-5, -5]
    })
    return L.marker(position, {
      icon: icon,
      clickable: false
    }).addTo(this._tipsLayerGroup)
  }
})

export default class LMeasure extends Measure {
  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxMeasure(me.options)
    me._lcmp._wrapper = me

    me.on('hide', me._onHide, me)
      .on('startmeasure', me._onStartMeasure, me)
      .on('endmeasure', me._onEndMeasure, me)

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
    this.disableMeasure()
    this.mapWrapper.removeControl(this._lcmp)
    super.onRemove()
  }

  _onLengthBtnClick() {
    const me = this
    const lMeasure = me._lcmp
    lMeasure.currentDrawer = lMeasure._polylineDrawer
    lMeasure._polylineDrawer.enable()
    lMeasure._polygonDrawer.disable()
    me.fire('startmeasure')
  }

  _onAreaBtnClick() {
    const me = this
    const lMeasure = me._lcmp
    lMeasure.currentDrawer = lMeasure._polygonDrawer
    lMeasure._polylineDrawer.disable()
    lMeasure._polygonDrawer.enable()
    me.fire('startmeasure')
  }

  _onCleanBtnClick() {
    const me = this
    const lMeasure = me._lcmp
    if (lMeasure.currentDrawer) lMeasure.currentDrawer.disable()
    lMeasure.measureItems.eachLayer(layer => {
      (layer._tips || []).forEach(function(tip) {
        tip.remove()
      })
      layer.remove()
    })
    lMeasure._tempTips.forEach(tip => {
      tip.remove()
    })
  }

  _onStartMeasure(e) {
    const me = this
    const map = me.mapWrapper.mapCmp
    map._ld_apply_to = LEAFLET_DRAW_MODE
  }

  _onEndMeasure(e) {
    const me = this
    const map = me.mapWrapper.mapCmp
    delete map._ld_apply_to
  }

  _onHide(e) {
    const me = this
    me.disableMeasure()
    me._lcmp.measureItems.clearLayers()
    me._lcmp._tipsLayerGroup.clearLayers()
  }

  disableMeasure() {
    super.disableMeasure()
    const me = this
    const lMeasure = me._lcmp
    const map = me.mapWrapper.mapCmp
    if (map._ld_apply_to === LEAFLET_DRAW_MODE) delete map._ld_apply_to
    if (lMeasure.currentDrawer) {
      lMeasure.currentDrawer.disable()
      lMeasure._tempTips.forEach(tip => {
        tip.remove()
      })
    }
  }
}
