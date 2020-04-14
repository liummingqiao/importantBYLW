import * as L from 'leaflet'
import DriveOverlay from '../../../std/layers/overlay/drive-overlay'

export var UxDriveOverlay = L.Class.extend({
  initialize: function(options) {
    var me = this
    L.setOptions(me, options)
    this._container = options._container
    L.stamp(me)
    if (options.callback) {
      this._scope = options.callback.scope || this
      this.onDraw = options.callback.onDraw
      this.onOpDraw = options.callback.onOpDraw
    }
    return me
  },
  addTo: function(map) {
    this._map = map

    const size = map.getSize()
    this._container.style.width = size.x
    this._container.style.height = size.y
    map._panes.markerPane.appendChild(this._container)

    // map._panes.overlayPane.appendChild(this._container)

    this.onAdd(map)

    this._map.on('unload', this.remove, this)

    return this
  },
  remove: function() {
    const map = this._map
    map._panes.markerPane.removeChild(this._container)
    // map._panes.overlayPane.removeChild(this._container)

    map.off('moveend', this._reset, this)
    map.off('resize', this._resize, this)
    map.off('unload', this.remove, this)

    if (map.options.zoomAnimation) {
      map.off('zoomanim', this._animateZoom, this)
    }
  },
  onAdd: function(map) {
    var me = this
    me._initStyle()
    me.setVisible(this.options.visible)

    map.on('moveend', this._reset, this)
    map.on('resize', this._resize, this)

    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on('zoomanim', this._animateZoom, this)
    }
    this._reset()
  },
  _initStyle: function() {
    // const el = this.el
    // el.style.position = 'absolute'
    // el.style.marginTop = '0'
    // el.style.marginRight = '0'
    // // el.style.right = '10px'
    // el.style.zIndex = '840'
    // el.style.top = '50px'
    // el.style.right = '10px'
  },
  setVisible: function(visible) {
    this._container.style.display = visible ? 'block' : 'none'
    this.options.visible = visible
  },
  _resize: function(resizeEvent) {
    this._container.style.width = resizeEvent.newSize.x
    this._container.style.height = resizeEvent.newSize.y
  },
  _reset: function() {
    this.mapBounds = this._map.getBounds()
    var topLeft = this._map.containerPointToLayerPoint([0, 0])
    L.DomUtil.setPosition(this._container, topLeft)
    this._redraw()
  },
  isLatLngInView(latLng, extend) {
    if (!this.mapBounds) {
      return false
    }
    let mapBounds = this.mapBounds
    if (extend) {
      mapBounds = L.latLngBounds(mapBounds.getSouthWest(), mapBounds.getNorthEast())
      mapBounds.extend({
        lat: mapBounds.getSouthWest().lat - extend,
        lng: mapBounds.getSouthWest().lng - extend
      }).extend({
        lat: mapBounds.getNorthEast().lat + extend,
        lng: mapBounds.getNorthEast().lng + extend
      })
    }
    return mapBounds.contains(latLng)
  },
  _redraw: function() {
    var size = this._map.getSize()
    var bounds = this._map.getBounds()
    var zoomScale = (size.x * 180) / (20037508.34 * (bounds.getEast() - bounds.getWest())) // resolution = 1/zoomScale
    var zoom = this._map.getZoom()
    var outsideBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      west: bounds.getWest(),
      east: bounds.getEast()
    }
    if (this.onDraw) {
      this.onDraw.call(this._scope, {
        el: this._container,
        bounds: outsideBounds,
        size: size,
        zoomScale: zoomScale,
        zoom: zoom
      })
    }

    this._frame = null
  },

  // _opRedraw: function() {
  //   var size = this._map.getSize()
  //   var bounds = this._map.getBounds()
  //   var zoomScale = (size.x * 180) / (20037508.34 * (bounds.getEast() - bounds.getWest())) // resolution = 1/zoomScale
  //   var zoom = this._map.getZoom()
  //   var outsideBounds = {
  //     north: bounds.getNorth(),
  //     south: bounds.getSouth(),
  //     west: bounds.getWest(),
  //     east: bounds.getEast()
  //   }

  //   if (this.onOpDraw) {
  //     this.onOpDraw.call(this._scope, {
  //       canvas: this._opCanvas,
  //       bounds: outsideBounds,
  //       size: size,
  //       zoomScale: zoomScale,
  //       zoom: zoom
  //     })
  //   }

  //   this._frame = null
  // },

  _animateZoom: function(e) {
    var scale = this._map.getZoomScale(e.zoom)
    var offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos())

    L.DomUtil.setTransform(this._container, offset, scale)
  },

  _latLngToPixelXY: function(latitude, longitude) {
    var pi_180 = Math.PI / 180.0
    var pi_4 = Math.PI * 4
    var sinLatitude = Math.sin(latitude * pi_180)
    var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256
    var pixelX = ((longitude + 180) / 360) * 256

    var pixel = { x: pixelX, y: pixelY }

    return pixel
  },

  _getProjectionOffset: function(latLng) {
    if (this._map.options.crs.code === 'BD09') {
      return this._map.project(latLng, 0)
    } else {
      return this._latLngToPixelXY(latLng.lat, latLng.lng)
    }
  },
  getZoomDistance: function() {
    return this._map.getMaxZoom() - this._map.getZoom()
  }
})

export default class LDriveOverlay extends DriveOverlay {
  create() {
    const me = this
    Object.assign(this.options, {
      _container: me.buildUI(),
      callback: {
        onDraw: me.onDraw,
        scope: me
      }
    })

    this._lcmp = new UxDriveOverlay(this.options)
    return me
  }

  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    this._lcmp.addTo(mapWrapper.mapCmp)
    return this
  }

  _setDrawData(data) {
    this._lcmp.setData(data)
  }

  getContainerElement() {
    return this._lcmp._container
  }
  repaint() {
    this._lcmp._redraw()
  }
  latLngToPoint(latLng) {
    const map = this.mapWrapper.mapCmp
    return map.latLngToContainerPoint(latLng)
  }
  setOpacity(opacity) {
    super.setOpacity(opacity)
    this._svg.style.opacity = opacity
  }
  setVisible(visible) {
    super.setVisible(visible)
    visible ? this._svg.style.display = 'block' : this._svg.style.display = 'none'
  }
}

