import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import Draw from '../../std/control/draw'
import DataUtil from '../../std/util/data-util'
import { DomEvent, DomUtil } from '../../std/util/dom-util'
import SYSTEM_CONFIG from '../../std/util/system-config'

const L = window.L
L.PM.initialize({ optIn: true })

const IMPORTANT_OPTIONS = {
  drawMarker: false,
  drawCircleMarker: false,
  drawCircle: false,
  editMode: true,
  dragMode: true,
  cutPolygon: false,
  removalMode: true
}

const COLOR_PROPERTIES = ['stroke', 'fill']
const OPACITY_PROPERTIES = ['stroke-opacity', 'fill-opacity']
const WIDTH_PROPERTIES = ['stroke-width']

class LDraw extends Draw {
  create() {
    const me = this
    me.on('hide', me._onHide, me)
    return this
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)

    const me = this
    const map = me.mapWrapper.mapCmp
    me.drawControl = new L.PM.Map(map)
    map.pm = me.drawControl
    map.pm.setGlobalOptions({
      snappable: false,
      cursorMarker: false,
      finishOn: 'dblclick',
      templineStyle: {
        color: me.options.color,
        weight: me.options.weight,
        opacity: me.options.opacity
      },
      hintlineStyle: {
        color: me.options.color,
        weight: me.options.weight,
        opacity: me.options.opacity,
        dashArray: [3, 15]
      }
    })
    // 设置语言
    map.pm.setLang('fleetmap', locales.draw, 'en')

    // 设置默认图形样式
    map.pm.setPathOptions({
      color: me.options.color,
      weight: me.options.weight,
      opacity: me.options.opacity,
      fillColor: me.options.fillColor,
      fillOpacity: me.options.fillOpacity
    })

    if (me.options.visible) me._show()

    return me
  }
  _show() {
    const me = this
    const options = {}
    Object.assign(options, me.options, IMPORTANT_OPTIONS)
    me.drawControl.addControls(options)
    me._bindEvent()
    me.options.visible = true
  }
  _hide() {
    const me = this
    if (!me.options.visible) return
    me._cleanControl()
    me.options.visible = false
  }
  remove() {
    const me = this
    const map = me.mapWrapper.mapCmp
    me._cleanControl()
    delete map.pm
  }

  _cleanControl() {
    const me = this
    me.drawControl.removeControls()
    const drawnItems = me._findLayers()
    for (const item of drawnItems) {
      item.remove()
    }
    me._unbindEvent()
  }

  _bindEvent() {
    const me = this
    const toolbar = me.drawControl.Toolbar
    const buttons = toolbar.getButtons()
    for (const k in buttons) {
      if (buttons[k].buttonsDomNode) {
        if (k.startsWith('draw')) {
          DomEvent.on(buttons[k].buttonsDomNode.childNodes[0], 'click', function(e) {
            me.fire('startdraw')
          }, me)
        } else {
          DomEvent.on(buttons[k].buttonsDomNode.childNodes[0], 'click', function(e) {
            me.fire('startedit')
          }, me)
          DomEvent.on(buttons[k].buttonsDomNode.childNodes[1], 'click', function(e) {
            me.fire('endedit')
          }, me)
        }
      }
    }
    const map = me.mapWrapper.mapCmp
    map.on('pm:create', me._onCreate, me)
      .on('crschange', me._transformCoords, me)
  }

  _unbindEvent() {
    const me = this
    const map = me.mapWrapper.mapCmp
    map.off('pm:create', me._onCreate, me)
      .off('crschange', me._transformCoords, me)
  }

  _onCreate(event) {
    const me = this
    const layer = event.layer

    layer.on('pm:edit', me._onEdit, me)

    const properties = me._getFeatureProperties(layer)
    layer.feature = {
      type: 'Feature',
      properties: properties
    }
    me._bindPropertiesPopup(layer)
    me._bindPM(layer)
    me.fire('enddraw')
  }

  _onEdit(event) {
    const me = this
    const layer = event.target
    Object.assign(layer.feature.properties, me._getBoundsAndCenter(layer))
  }

  _onLayerCut(event) {
    const me = this
    const newLayer = event.layer
    const oldLayer = event.target
    newLayer.feature = oldLayer.feature
    newLayer.once('pm:cut', me._onLayerCut, me)
    me._bindPropertiesPopup(newLayer)
    me.fire('enddraw')
  }

  _onHide(event) {
    const me = this
    me.disableDraw()
  }

  _transformCoords(e) {
    const me = this
    // 底图改变后根据坐标系更新坐标
    const drawnItems = me._findLayers()
    for (const layer of drawnItems) {
      if (layer instanceof L.Circle) {
        const srcCenter = layer.getLatLng()
        const destCenter = DataUtil.transform(srcCenter.lat, srcCenter.lng, e.oldCrs.code, e.newCrs.code)
        layer.setLatLng(destCenter)
      } else {
        // 忽略 marker 和 circlemarker
        const srcLatLngs = layer.getLatLngs()
        let destLatLngs
        if (layer instanceof L.Polygon) {
          destLatLngs = srcLatLngs.map(latLngs =>
            latLngs.map(latLng =>
              DataUtil.transform(latLng.lat, latLng.lng, e.oldCrs.code, e.newCrs.code)
            )
          )
        } else if (layer instanceof L.Polyline) {
          destLatLngs = srcLatLngs.map(latLng =>
            DataUtil.transform(latLng.lat, latLng.lng, e.oldCrs.code, e.newCrs.code)
          )
        }
        layer.setLatLngs(destLatLngs)
      }
      layer.redraw()
      // 更新popup位置
      if (layer.isPopupOpen()) {
        const popup = layer.getPopup()
        const latLng = popup.getLatLng()
        const destLatLng = DataUtil.transform(latLng.lat, latLng.lng, e.oldCrs.code, e.newCrs.code)
        popup.setLatLng(destLatLng)
        popup.update()
      }
    }
  }

  disableDraw() {
    super.disableDraw()
    const me = this
    if (me.drawControl) {
      me.drawControl.disableDraw()
      me.drawControl.disableGlobalEditMode()
      me.drawControl.disableGlobalDragMode()
      me.drawControl.disableGlobalRemovalMode()
    }
  }

  setGeoJSON(data) {
    const me = this

    // 清除现有图形
    me.clear()

    me._addGeoJSONData(data)
  }

  addGeoJSON(data) {
    this._addGeoJSONData(data)
  }

  _addGeoJSONData(data) {
    const me = this
    const map = me.mapWrapper.mapCmp
    const geoJson = me._standardInput(data)
    const layerGroup = L.geoJSON(geoJson, {
      style: feature => {
        const style = {}
        if (feature.properties['stroke']) style.color = feature.properties['stroke']
        if (feature.properties['stroke-width']) style.weight = feature.properties['stroke-width']
        if (feature.properties['stroke-opacity']) style.opacity = feature.properties['stroke-opacity']
        if (feature.properties['fill']) style.fillColor = feature.properties['fill']
        if (feature.properties['fill-opacity']) style.fillOpacity = feature.properties['fill-opacity']
        if (Object.getOwnPropertyNames(style).length === 0) {
          const featureType = feature.geometry.type
          style.color = me.options.color
          style.weight = me.options.weight
          style.opacity = me.options.opacity
          if (featureType === 'MultiPolygon' || featureType === 'Polygon') {
            style.fillColor = me.options.fillColor
            style.fillOpacity = me.options.fillOpacity
          }
        }
        return style
      }
    })
    layerGroup.eachLayer(layer => {
      me._bindPropertiesPopup(layer)
      me._bindPM(layer)
      layer.on('pm:edit', me._onEdit, me)
      layer.addTo(map)
    })
  }

  getGeoJSON() {
    const me = this
    const layers = me._findLayers()
    const layerGroup = L.layerGroup(layers)
    const data = layerGroup.toGeoJSON()
    const geoJson = me._standardOutput(data)
    return geoJson
  }

  onRemove() {
    const me = this
    const map = me.mapWrapper.mapCmp
    me.disableDraw()
    me._cleanControl()
    delete map.pm
    super.onRemove()
  }

  _bindPropertiesPopup(layer) {
    const me = this
    layer._popupHandlersAdded = true
    layer.on('click', function(e) {
      const map = me.mapWrapper.mapCmp
      if (!(map.pm.globalDragModeEnabled() || map.pm.globalEditEnabled() || map.pm.globalRemovalEnabled())) {
        layer.openPopup(e.layer || e.target, e.latlng)
      }
    })
    layer.bindPopup('', { closeButton: false })
    layer.on('popupopen', me._updatePropertiesPopup, me)
  }

  _getFeatureProperties(layer) {
    if (layer.feature) {
      return Object.assign(layer.feature.properties || {}, this._getBoundsAndCenter(layer))
    }
    const options = layer.options
    const properties = {}
    properties['stroke'] = options.color
    properties['stroke-width'] = options.weight
    properties['stroke-opacity'] = options.opacity
    if (layer instanceof L.Polygon) {
      properties['fill'] = options.fillColor
      properties['fill-opacity'] = options.fillOpacity
    }
    return Object.assign({}, properties, this._getBoundsAndCenter(layer))
  }

  _getBoundsAndCenter(layer) {
    // bounds, center
    const feature = L.featureGroup([layer])
    const bounds = feature.getBounds()
    const center = bounds.getCenter()
    return {
      bounds: this._standardOutputBounds(bounds),
      center: this._standardOutputCenter(center)
    }
  }

  _updatePropertiesPopup(e) {
    const me = this
    const layer = e.target
    const properties = me._getFeatureProperties(layer)
    const popupContainer = DomUtil.create('div')
    const contentDiv = DomUtil.create('div', 'fm-draw-feature-popup-content', popupContainer)
    const propertyTable = DomUtil.create('table', 'fm-draw-feature-popup-properties', contentDiv)
    const propertyTableBody = DomUtil.create('tbody', undefined, propertyTable)
    for (const key in properties) {
      const row = DomUtil.create('tr', undefined, propertyTableBody)
      const name = DomUtil.create('th', undefined, row)
      const nameInput = DomUtil.create('input', undefined, name)
      nameInput.type = 'text'
      nameInput.value = key
      const value = DomUtil.create('td', undefined, row)
      const valueInput = DomUtil.create('input', undefined, value)
      const attrs = me._getInputAttrs(key)
      Object.assign(valueInput, attrs)
      if (typeof properties[key] === 'object') {
        valueInput.readOnly = true
        valueInput.value = JSON.stringify(properties[key])
      } else {
        valueInput.value = properties[key]
      }
    }

    const btnDiv = DomUtil.create('div', 'fm-draw-feature-popup-btn', popupContainer)
    const add = DomUtil.create('button', 'fm-common-button fm-common-button--primary fm-common-button--mini', btnDiv)
    const addSpan = DomUtil.create('span', undefined, add)
    addSpan.innerHTML = locales.common.add
    DomEvent.on(add, 'click', function(e) {
      const tableBody = this
      const row = DomUtil.create('tr', undefined, tableBody)
      const name = DomUtil.create('th', undefined, row)
      const nameInput = DomUtil.create('input', undefined, name)
      nameInput.type = 'text'
      const value = DomUtil.create('td', undefined, row)
      const valueInput = DomUtil.create('input', undefined, value)
      valueInput.type = 'text'
      propertyTable.scrollTo(0, tableBody.scrollHeight)
    }, propertyTableBody)

    const save = DomUtil.create('button', 'fm-common-button fm-common-button--primary fm-common-button--mini', btnDiv)
    const saveSpan = DomUtil.create('span', undefined, save)
    saveSpan.innerHTML = locales.common.save
    DomEvent.on(save, 'click', function(e) {
      const tableBody = this
      const inputDoms = Array.prototype.slice.call(tableBody.querySelectorAll('input'))
      const inputValues = inputDoms.map(dom => dom.value)
      const properties = {}
      for (let i = 0; i < inputValues.length / 2; i++) {
        if (inputValues[2 * i].trim()) {
          properties[inputValues[2 * i]] = inputValues[2 * i + 1]
          if (inputDoms[2 * i + 1].readOnly) {
            properties[inputValues[2 * i]] = JSON.parse(inputValues[2 * i + 1])
          }
        }
      }
      me._applyPropertiesToFeature(layer, properties)
      layer.closePopup()
    }, propertyTableBody)

    const cancel = DomUtil.create('button', 'fm-common-button fm-common-button--danger fm-common-button--mini', btnDiv)
    const cancelSpan = DomUtil.create('span', undefined, cancel)
    cancelSpan.innerHTML = locales.common.cancel
    DomEvent.on(cancel, 'click', function(e) {
      layer.closePopup()
    }, propertyTableBody)

    layer.setPopupContent(popupContainer)
  }

  _getInputAttrs(propertyName) {
    const inputType = {}
    if (COLOR_PROPERTIES.includes(propertyName)) {
      inputType.type = 'color'
    } else if (OPACITY_PROPERTIES.includes(propertyName) || WIDTH_PROPERTIES.includes(propertyName)) {
      inputType.type = 'number'
      inputType.min = 0
      inputType.step = 0.1
      if (OPACITY_PROPERTIES.includes(propertyName)) inputType.max = 1
    } else {
      inputType.type = 'text'
    }
    return inputType
  }

  _applyPropertiesToFeature(layer, properties) {
    const me = this
    layer.feature.properties = Object.assign({}, properties)
    const styleOptions = {}
    styleOptions.color = properties['stroke'] || me.options.color
    styleOptions.weight = properties['stroke-width'] || me.options.weight
    styleOptions.opacity = properties['stroke-opacity'] || me.options.opacity
    if (layer instanceof L.Polygon) {
      styleOptions.fillColor = properties['fill'] || me.options.fillColor
      styleOptions.fillOpacity = properties['fill-opacity'] || me.options.fillOpacity
    }
    layer.setStyle(styleOptions)
  }

  _bindPM(layer) {
    const me = this
    Object.assign(layer.options, { pmIgnore: false })
    if (layer instanceof L.Rectangle) {
      layer.pm = new L.PM.Edit.Rectangle(layer)
      layer.once('pm:cut', me._onLayerCut, me)
    } else if (layer instanceof L.Polygon) {
      layer.pm = new L.PM.Edit.Polygon(layer)
      layer.once('pm:cut', me._onLayerCut, me)
    } else if (layer instanceof L.Polyline) {
      layer.pm = new L.PM.Edit.Line(layer)
    } else if (layer instanceof L.Circle) {
      layer.pm = new L.PM.Edit.Circle(layer)
    }
  }

  _standardOutput(data) {
    const me = this
    const map = me.mapWrapper.mapCmp
    const srcCrsCode = map.options.crs.code
    const destCrsCode = SYSTEM_CONFIG.CRS_CODE
    return me._transformGeoCoords(data, srcCrsCode, destCrsCode)
  }

  _standardOutputBounds(bounds) {
    const me = this
    const map = me.mapWrapper.mapCmp
    const srcCrsCode = map.options.crs.code
    const destCrsCode = SYSTEM_CONFIG.CRS_CODE
    const standardBounds = {}
    standardBounds._northEast = DataUtil.transform(bounds._northEast.lat, bounds._northEast.lng, srcCrsCode, destCrsCode)
    standardBounds._southWest = DataUtil.transform(bounds._southWest.lat, bounds._southWest.lng, srcCrsCode, destCrsCode)
    return {
      north: standardBounds._northEast.lat,
      south: standardBounds._southWest.lat,
      west: standardBounds._southWest.lng,
      east: standardBounds._northEast.lng
    }
  }

  _standardOutputCenter(center) {
    const me = this
    const map = me.mapWrapper.mapCmp
    const srcCrsCode = map.options.crs.code
    const destCrsCode = SYSTEM_CONFIG.CRS_CODE
    return DataUtil.transform(center.lat, center.lng, srcCrsCode, destCrsCode)
  }

  _standardInput(data) {
    const me = this

    const geoJSON = L.geoJSON(data).toGeoJSON()

    const map = me.mapWrapper.mapCmp
    const srcCrsCode = SYSTEM_CONFIG.CRS_CODE
    const destCrsCode = map.options.crs.code
    return me._transformGeoCoords(geoJSON, srcCrsCode, destCrsCode)
  }

  _transformGeoCoords(data, srcCrsCode, destCrsCode) {
    const me = this
    const geoJson = DataUtil.deepClone({}, data)
    if (geoJson && (srcCrsCode !== destCrsCode)) {
      const features = geoJson.features
      for (const feature of features) {
        const coordinates = feature.geometry.coordinates
        const destCoordinates = me._transform(coordinates, srcCrsCode, destCrsCode)
        feature.geometry.coordinates = destCoordinates
      }
    }
    return geoJson
  }

  _transform(coordinates, srcCrsCode, destCrsCode) {
    if (!Array.isArray(coordinates)) throw new Error('coordinates should be an array')
    const me = this
    if (Array.isArray(coordinates[0])) {
      const destCoordinates = []
      for (const coords of coordinates) {
        destCoordinates.push(me._transform(coords, srcCrsCode, destCrsCode))
      }
      return destCoordinates
    } else {
      const destCoord = DataUtil.transform(coordinates[1], coordinates[0], srcCrsCode, destCrsCode)
      return [destCoord.lng, destCoord.lat]
    }
  }

  clear() {
    const me = this
    const layers = me._findLayers()
    layers.map(layer => layer.remove())
  }

  removeGeoJSON(filter) {
    const me = this
    const layers = me._findLayers()
    for (const layer of layers) {
      const geoJson = layer.toGeoJSON()
      if (filter(geoJson) === true) {
        layer.remove()
      }
    }
  }

  getBounds() {
    const me = this
    const layers = me._findLayers()
    const featureGroup = L.featureGroup(layers)
    const bounds = featureGroup.getBounds()
    if (bounds) {
      return me._standardOutputBounds(bounds)
    }
  }

  _findLayers() {
    const me = this
    const map = me.mapWrapper.mapCmp
    let layers = []
    map.eachLayer(layer => {
      if (
        layer instanceof L.Polyline ||
        layer instanceof L.Marker ||
        layer instanceof L.Circle ||
        layer instanceof L.CircleMarker
      ) {
        layers.push(layer)
      }
    })

    // filter out layers that don't have the leaflet-geoman instance
    layers = layers.filter(layer => !!layer.pm)

    // filter out everything that's leaflet-geoman specific temporary stuff
    layers = layers.filter(layer => !layer._pmTempLayer)

    return layers
  }
}

export default LDraw
