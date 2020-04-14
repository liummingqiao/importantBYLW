import CanvasOverlay from '../../../std/layers/overlay/canvas-overlay'
import PointOverlay from '../../../std/layers/overlay/point-overlay'
import GridOverlay from '../../../std/layers/overlay/grid-overlay'
import WebglPointOverlay from '../../../std/layers/overlay/webgl-point-overlay'
import WebglGridOverlay from '../../../std/layers/overlay/webgl-grid-overlay'
import WebglLineOverlay from '../../../std/layers/overlay/webgl-line-overlay'
import CellOverlay from '../../../std/layers/overlay/cell-overlay'
import LinkOverlay from '../../../std/layers/overlay/link-overlay'
import IconOverlay from '../../../std/layers/overlay/icon-overlay'

import mixin from '../../../std/util/mixin'
import * as L from 'leaflet'

export var UxCanvasOverlay = L.Class.extend({
  initialize: function(options) {
    var me = this
    L.setOptions(me, options)
    this._canvas = options._canvas
    this._opCanvas = options._opCanvas
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
    this._canvas.width = size.x
    this._canvas.height = size.y
    if (this.options.offsetX) {
      this._canvas.style.left = this.options.offsetX + 'px'
    }
    if (this.options.offsetY) {
      this._canvas.style.top = this.options.offsetY + 'px'
    }
    map._panes.overlayPane.appendChild(this._canvas)
    if (this._opCanvas) {
      this._opCanvas.width = size.x
      this._opCanvas.height = size.y
      if (this.options.offsetX) {
        this._opCanvas.style.left = this.options.offsetX + 'px'
      }
      if (this.options.offsetY) {
        this._opCanvas.style.top = this.options.offsetY + 'px'
      }
      map._panes.overlayPane.appendChild(this._opCanvas)
    }

    this.onAdd(map)

    this._map.on('unload', this.remove, this)

    return this
  },
  remove: function() {
    const map = this._map
    map._panes.overlayPane.removeChild(this._canvas)
    if (this._opCanvas) {
      map._panes.overlayPane.removeChild(this._opCanvas)
    }

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
    this._canvas.style.display = visible ? 'block' : 'none'
    if (this._opCanvas) {
      this._opCanvas.style.display = visible ? 'block' : 'none'
    }
    this.options.visible = visible
  },
  _resize: function(resizeEvent) {
    this._canvas.width = resizeEvent.newSize.x
    this._canvas.height = resizeEvent.newSize.y
    if (this._opCanvas) {
      this._opCanvas.width = resizeEvent.newSize.x
      this._opCanvas.height = resizeEvent.newSize.y
    }
  },
  _reset: function() {
    this.mapBounds = this._map.getBounds()
    var topLeft = this._map.containerPointToLayerPoint([0, 0])
    L.DomUtil.setPosition(this._canvas, topLeft)
    if (this._opCanvas) {
      L.DomUtil.setPosition(this._opCanvas, topLeft)
    }
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
        canvas: this._canvas,
        bounds: outsideBounds,
        size: size,
        zoomScale: zoomScale,
        zoom: zoom
      })
    }
    if (this.onOpDraw) {
      this.onOpDraw.call(this._scope, {
        canvas: this._opCanvas,
        bounds: outsideBounds,
        size: size,
        zoomScale: zoomScale,
        zoom: zoom
      })
    }

    this._frame = null
  },
  _rawRepaint: function() {
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
        canvas: this._canvas,
        bounds: outsideBounds,
        size: size,
        zoomScale: zoomScale,
        zoom: zoom
      })
    }
  },
  _opRedraw: function() {
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

    if (this.onOpDraw) {
      this.onOpDraw.call(this._scope, {
        canvas: this._opCanvas,
        bounds: outsideBounds,
        size: size,
        zoomScale: zoomScale,
        zoom: zoom
      })
    }

    this._frame = null
  },

  _animateZoom: function(e) {
    var scale = this._map.getZoomScale(e.zoom)
    var offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos())

    L.DomUtil.setTransform(this._canvas, offset, scale)
    if (this._opCanvas) {
      L.DomUtil.setTransform(this._opCanvas, offset, scale)
    }
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

var CanvasBase = {
  _create() {
    const me = this
    Object.assign(this.options, {
      _canvas: me._canvas,
      _opCanvas: me._opCanvas,
      callback: {
        onDraw: me.onDraw,
        onOpDraw: me.onOpDraw,
        scope: me
      }
    })

    me._lcmp = new UxCanvasOverlay(me.options)
    return me
  },

  repaint() {
    this._lcmp._redraw()
  },

  rawRepaint() {
    this._lcmp._redraw()
  },

  opRepaint() {
    this._lcmp._opRedraw()
  },

  isInView(latLng, extend) {
    return this._lcmp.isLatLngInView(latLng, extend)
  },

  getZoomDistance() {
    return this._lcmp.getZoomDistance()
  },

  latLngToPoint(latLng) {
    const map = this.mapWrapper.mapCmp
    return map.latLngToContainerPoint(latLng)
  },

  pixelToDegrees(pixelDistance) {
    if (!pixelDistance) {
      return 0
    }

    const map = this.mapWrapper.mapCmp
    const size = map.getSize()
    const center = {
      x: size.x / 2,
      y: size.y / 2
    }
    const latLngX = map.containerPointToLatLng(center)
    const latLngY = map.containerPointToLatLng({
      x: center.x + pixelDistance, // 在x轴上加上此距离，然后再获得经度差
      y: center.y
    })
    return latLngY.lng - latLngX.lng
  },

  _addTo(mapWrapper) {
    this._lcmp.addTo(mapWrapper.mapCmp)
    return this
  },
  getContainerElement() {
    return this._lcmp.el
  },
  _getProjectionOffset(latLng) {
    return this._lcmp._getProjectionOffset(latLng)
  }
}

export default class LCanvasOverlay extends mixin(CanvasOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }

  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}

export class LPointOverlay extends mixin(PointOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}
export class LWebglPointOverlay extends mixin(WebglPointOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}

export class LGridOverlay extends mixin(GridOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}
export class LWebglGridOverlay extends mixin(WebglGridOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}

export class LCellOverlay extends mixin(CellOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}

export class LLinkOverlay extends mixin(LinkOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}

export class LIconOverlay extends mixin(IconOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}

export class LLineOverlay extends mixin(WebglLineOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  renderGeoJSON(geoJson) {
    L.geoJSON(geoJson).addTo(this.mapWrapper.mapCmp)
  }
  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}

export class LWebglLineOverlay extends mixin(WebglLineOverlay, CanvasBase) {
  create() {
    super.create()
    return this._create()
  }

  renderGeoJSON(geoJson) {
    L.geoJSON(geoJson).addTo(this.mapWrapper.mapCmp)
  }

  destroy() {
    super.destroy()
    this._lcmp.remove()
    this.mapWrapper.mapCmp.removeLayer(this._lcmp)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    return this._addTo(mapWrapper)
  }
}
