import * as L from 'leaflet'

import Layers from '../../std/control/layers'
import LTileLayer from '../layers/tilelayers/l-tile-layer'
import DataUtil from '../../std/util/data-util'

var UxLayers = L.Control.extend({
  options: {
    position: 'topright',

    // @option autoZIndex: Boolean = true
    // If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
    autoZIndex: true,

    // @option hideSingleBase: Boolean = false
    // If `true`, the base layers in the control will be hidden when there is only one.
    hideSingleBase: false,
    collapsed: false,
    visible: true
  },

  initialize: function(baseLayers, options) {
    L.setOptions(this, options)

    this._layerControlInputs = []
    this._layers = []
    this._handlingClick = false

    for (var i in baseLayers) {
      this._addLayer(baseLayers[i]['tileLayer']._lcmp, i, baseLayers[i])
    }
  },

  onAdd: function(map) {
    this._initLayout()
    this._update()

    this._map = map

    map.on('zoomend', this._checkDisabledLayers, this).on('crschange', this._transformMapCenter, this)

    for (let i = 0; i < this._layers.length; i++) {
      this._layers[i].layer.on('add remove', this._onLayerChange, this)
    }

    if (this.options.visible === false) {
      L.DomUtil.addClass(this._container, 'control-display-none')
    }

    return this._container
  },

  addTo: function(map) {
    L.Control.prototype.addTo.call(this, map)
    // Trigger expand after Layers Control has been inserted into DOM so that is now has an actual height.
    return this._expandIfNotCollapsed()
  },

  onRemove: function() {
    this._map.off('zoomend', this._checkDisabledLayers, this)
    this._map.off('crschange', this._transformMapCenter, this)

    for (var i = 0; i < this._layers.length; i++) {
      this._layers[i].layer.off('add remove', this._onLayerChange, this)
    }
  },

  // @method addBaseLayer(layer: Layer, name: String): this
  // Adds a base layer (radio button entry) with the given name to the control.
  addBaseLayer: function(layer, name) {
    this._addLayer(layer, name)
    return (this._map) ? this._update() : this
  },

  // @method addOverlay(layer: Layer, name: String): this
  // Adds an overlay (checkbox entry) with the given name to the control.
  addOverlay: function(layer, name) {
    this._addLayer(layer, name, true)
    return (this._map) ? this._update() : this
  },

  // @method removeLayer(layer: Layer): this
  // Remove the given layer from the control.
  removeLayer: function(layer) {
    layer.off('add remove', this._onLayerChange, this)

    var obj = this._getLayer(L.stamp(layer))
    if (obj) {
      this._layers.splice(this._layers.indexOf(obj), 1)
    }
    return (this._map) ? this._update() : this
  },

  // @method expand(): this
  // Expand the control container if collapsed.
  expand: function() {
    L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded')
    this._section.style.height = null
    var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50)
    if (acceptableHeight < this._section.clientHeight) {
      L.DomUtil.addClass(this._section, 'leaflet-control-layers-scrollbar')
      this._section.style.height = acceptableHeight + 'px'
    } else {
      L.DomUtil.removeClass(this._section, 'leaflet-control-layers-scrollbar')
    }
    this._checkDisabledLayers()
    return this
  },

  // @method collapse(): this
  // Collapse the control container if expanded.
  collapse: function() {
    L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded')
    return this
  },

  _initLayout: function() {
    var className = 'leaflet-control-layers'
    var container = this._container = L.DomUtil.create('div', className)
    var collapsed = this.options.collapsed

    // makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
    container.setAttribute('aria-haspopup', true)

    L.DomEvent.disableClickPropagation(container)
    L.DomEvent.disableScrollPropagation(container)

    var section = this._section = L.DomUtil.create('section', className + '-list')

    if (collapsed) {
      this._map.on('click', this.collapse, this)
    }

    var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container)
    link.href = '#'
    link.title = 'Layers'

    if (!collapsed) {
      this.expand()
    }

    this._baseLayersList = L.DomUtil.create('div', className + '-base', section)
    this._separator = L.DomUtil.create('div', className + '-separator', section)
    this._overlaysList = L.DomUtil.create('div', className + '-overlays', section)

    container.appendChild(section)
  },

  _getLayer: function(id) {
    for (var i = 0; i < this._layers.length; i++) {
      if (this._layers[i] && L.stamp(this._layers[i].layer) === id) {
        return this._layers[i]
      }
    }
  },

  _addLayer: function(layer, name, layerCfg) {
    if (this._map) {
      layer.on('add remove', this._onLayerChange, this)
    }

    this._layers.push({
      layer: layer,
      name: name,
      cfg: layerCfg
    })

    this._expandIfNotCollapsed()
  },

  _update: function() {
    if (!this._container) { return this }

    L.DomUtil.empty(this._baseLayersList)

    this._layerControlInputs = []
    var baseLayersPresent; var overlaysPresent; var i; var obj; var baseLayersCount = 0

    for (i = 0; i < this._layers.length; i++) {
      obj = this._layers[i]
      this._addItem(obj)
      overlaysPresent = overlaysPresent || obj.overlay
      baseLayersPresent = baseLayersPresent || !obj.overlay
      baseLayersCount += !obj.overlay ? 1 : 0
    }

    // Hide base layers section if there's only one layer.
    if (this.options.hideSingleBase) {
      baseLayersPresent = baseLayersPresent && baseLayersCount > 1
      this._baseLayersList.style.display = baseLayersPresent ? '' : 'none'
    }

    this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none'

    return this
  },

  _onLayerChange: function(e) {
    if (!this._handlingClick) {
      this._update()
    }

    var obj = this._getLayer(L.stamp(e.target))

    var type = e.type === 'add' ? 'baselayerchange' : null

    if (type) {
      this._map.fire(type, obj)
      this._resetMapView()
    }
  },
  _resetMapView() {
    if (this._lastMapCenter && this._lastZoom) {
      this._map.setView(this._lastMapCenter, this._lastZoom)
    }
  },
  _transformMapCenter(e) {
    if (this._lastMapCenter) {
      const from = e.oldCrs.code
      const to = e.newCrs.code
      this._lastMapCenter = DataUtil.transform(this._lastMapCenter.lat, this._lastMapCenter.lng, from, to)
    }
  },
  addDefaultLayer(map) {
    this._lastMapCenter = map.getCenter()
    this._lastZoom = map.getZoom()
    for (let i = 0; i < this._layers.length; i++) {
      if (this._layers[i].cfg.activated === true) {
        this._layers[i].layer.addTo(map)
        break
      }
    }

    // 默认由控件加载时，必须在地图初始化后将地图view reset
    setTimeout(() => {
      this._resetMapView()
    }, 0)
  },

  // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
  _createRadioElement: function(name, checked) {
    var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' +
				name + '"' + (checked ? ' checked="checked"' : '') + '/>'

    var radioFragment = document.createElement('div')
    radioFragment.innerHTML = radioHtml

    return radioFragment.firstChild
  },

  _addItem: function(obj) {
    var label = document.createElement('label')
    var checked = this._map.hasLayer(obj.layer)
    var input

    input = this._createRadioElement('leaflet-base-layers_' + L.stamp(this), checked)

    this._layerControlInputs.push(input)
    input.layerId = L.stamp(obj.layer)

    L.DomEvent.on(input, 'click', this._onInputClick, this)

    var name = document.createElement('span')
    name.innerHTML = ' ' + obj.name

    // Helps from preventing layer control flicker when checkboxes are disabled
    // https://github.com/Leaflet/Leaflet/issues/2771
    var holder = document.createElement('div')

    label.appendChild(holder)
    holder.appendChild(input)
    holder.appendChild(name)

    var container = obj.overlay ? this._overlaysList : this._baseLayersList
    container.appendChild(label)

    this._checkDisabledLayers()
    return label
  },

  _onInputClick: function() {
    var inputs = this._layerControlInputs
    var input
    var layer
    var addedLayers = []
    var removedLayers = []

    this._handlingClick = true

    for (var i = inputs.length - 1; i >= 0; i--) {
      input = inputs[i]
      layer = this._getLayer(input.layerId).layer

      if (input.checked) {
        addedLayers.push(layer)
      } else if (!input.checked) {
        removedLayers.push(layer)
      }
    }

    this._lastMapCenter = this._map.getCenter()
    this._lastZoom = this._map.getZoom()

    // Bugfix issue 2318: Should remove all old layers before readding new ones
    for (i = 0; i < removedLayers.length; i++) {
      if (this._map.hasLayer(removedLayers[i])) {
        this._map.removeLayer(removedLayers[i])
      }
    }
    for (i = 0; i < addedLayers.length; i++) {
      if (!this._map.hasLayer(addedLayers[i])) {
        this._map.addLayer(addedLayers[i])
      }
    }

    this._handlingClick = false

    this._refocusOnMap()
  },

  _checkDisabledLayers: function() {
    var inputs = this._layerControlInputs
    var input
    var layer
    var zoom = this._map.getZoom()

    for (var i = inputs.length - 1; i >= 0; i--) {
      input = inputs[i]
      layer = this._getLayer(input.layerId).layer
      input.disabled = (layer.options.minZoom !== undefined && zoom < layer.options.minZoom) ||
      (layer.options.maxZoom !== undefined && zoom > layer.options.maxZoom)
    }
  },

  _expandIfNotCollapsed: function() {
    if (this._map && !this.options.collapsed) {
      this.expand()
    }
    return this
  },

  _expand: function() {
    // Backward compatibility, remove me in 1.1.
    return this.expand()
  },

  _collapse: function() {
    // Backward compatibility, remove me in 1.1.
    return this.collapse()
  }

})

export default class LLayers extends Layers {
  // constructor(opts) {
  //   super(opts)
  // }

  create() {
    const me = this
    const options = me.options
    const baseLayers = options.baseLayers

    const baseMaps = {
      // key: {
      //   tileLayer: LTileLayer
      //   activated: true
      // }
    }

    Object.keys(baseLayers).forEach(function(key) {
      baseLayers[key].forEach(function(tileCfg) {
        baseMaps[tileCfg['title']] = {
          tileLayer:
          new LTileLayer({
            tile: `${key}.${tileCfg['type']}`
          }).create(),
          activated: tileCfg['activated']
        }
        if (tileCfg['activated']) {
          me.activated = `${key}.${tileCfg['type']}`
        }
      })
    })

    me._lcmp = new UxLayers(baseMaps, options)
    return me
  }

  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    const me = this
    me._lcmp.addDefaultLayer(mapWrapper.mapCmp)
    me._lcmp.addTo(mapWrapper.mapCmp)
    // 业务需求，切换了base layer后，隐藏layers control
    mapWrapper.mapCmp.on('baselayerchange', this.onBaseLayerChange, me)
    return this
  }

  setVisible(visible) {
    if (visible) {
      L.DomUtil.removeClass(this._lcmp._container, 'control-display-none')
    } else {
      L.DomUtil.addClass(this._lcmp._container, 'control-display-none')
    }
    this.options.visible = !!visible
    return this
  }
  onBaseLayerChange() {
    if (this.mapWrapper.controls['layers'].trigger) {
      this.mapWrapper.controls['layers'].trigger.click()
    }
  }
}
