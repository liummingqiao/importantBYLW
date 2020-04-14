import * as L from 'leaflet'
import MapWrapper from '../std/map-wrapper'
import LTileLayer from './layers/tilelayers/l-tile-layer'
import LLayers from './control/l-layers'
import LToolbar from './control/l-toolbar'
import LDraw from './control/l-draw'
import LPanel from './control/l-panel'
import LOverlays from './control/l-overlays'
import LScrollMsg from './control/l-scroll-msg'
import { LWebglPointOverlay, LPointOverlay, LWebglGridOverlay, LGridOverlay, LCellOverlay, LLinkOverlay, LIconOverlay, LWebglLineOverlay } from './layers/overlay/l-canvas-overlays'
import LMeasure from './control/l-measure'
import LLocate from './control/l-locate'
import LLegend from './control/l-legend'
import LHeatmapOverlay from './layers/overlay/l-heatmap-overlay'
import LDriveOverlay from './layers/overlay/l-drive-overlay'
import LBaiduStreet from './control/l-baidu-street'
import LGoogleStreet from './control/l-google-street'
import LCoordPicker from './control/l-coord-picker'

import LMarker from './layers/l-marker'

import SYSTEM_CONFIG from '../std/util/system-config'
import DataUtil from '../std/util/data-util'

// 默认参数
export default class LeafletWrapper extends MapWrapper {
  constructor(divId, options) {
    super(divId, options)
    this.mapCmp = L.map(divId, this.options)
  }
  create() {
    super.create()
    this.mapCmp.on('mousemove click', this._onMapMouseMoveClick, this)
    this.mapCmp.on('movestart', this._onMapMoveStart, this)
    this.mapCmp.on('moveend', this._onMapMoveEnd, this)

    this.mapCmp.on('baselayerchange', this.__baseLayerChange, this)
    this.mapCmp.on('crschange', this.__crsChange, this)
  }
  createScale(opts) {
    return L.control.scale(opts).addTo(this.mapCmp)
  }
  createContextMenu(opts) {
    window.oncontextmenu = (e) => {
      const me = this
      console.log(e.target === me.mapCmp._container)
    }
  }
  createZoom(opts) {
    return L.control.zoom(opts).addTo(this.mapCmp)
  }
  createTileLayer(opts) {
    return new LTileLayer(opts).create().addTo(this).onAdd(this)
  }
  createToolbar(opts) {
    return new LToolbar(opts).create().addTo(this).onAdd(this)
  }
  createBaseLayers(opts) {
    return new LLayers(opts).create().addTo(this).onAdd(this)
  }
  createDraw(opts) {
    return new LDraw(opts).create().addTo(this).onAdd(this)
  }
  createMeasure(opts) {
    return new LMeasure(opts).create().addTo(this).onAdd(this)
  }
  createLocate(opts) {
    return new LLocate(opts).create().addTo(this).onAdd(this)
  }
  createCoordPicker(opts) {
    return new LCoordPicker(opts).create().addTo(this).onAdd(this)
  }
  createPanel(opts) {
    return new LPanel(opts).create().addTo(this).onAdd(this)
  }
  createOverlays(opts) {
    return new LOverlays(opts).create().addTo(this).onAdd(this)
  }
  createScrollMsg(opts) {
    return new LScrollMsg(opts).create().addTo(this).onAdd(this)
  }
  createHeatmap(opts) {
    return new LHeatmapOverlay(opts).create().addTo(this).onAdd(this)
  }
  createBaiduStreet(opts) {
    return new LBaiduStreet(opts).create().addTo(this).onAdd(this)
  }
  createGoogleStreet(opts) {
    return new LGoogleStreet(opts).create().addTo(this).onAdd(this)
  }
  createWebGlPointOverlay(opts) {
    return new LWebglPointOverlay(opts).create().addTo(this).onAdd(this)
  }
  createPointOverlay(opts) {
    return new LPointOverlay(opts).create().addTo(this).onAdd(this)
  }
  createWebGlGridOverlay(opts) {
    return new LWebglGridOverlay(opts).create().addTo(this).onAdd(this)
  }
  createGridOverlay(opts) {
    return new LGridOverlay(opts).create().addTo(this).onAdd(this)
  }
  createCellOverlay(opts) {
    return new LCellOverlay(opts).create().addTo(this).onAdd(this)
  }
  createLegend(opts) {
    return new LLegend(opts).create().addTo(this).onAdd(this)
  }
  createLinkOverlay(opts) {
    return new LLinkOverlay(opts).create().addTo(this).onAdd(this)
  }
  createIconOverlay(opts) {
    return new LIconOverlay(opts).create().addTo(this).onAdd(this)
  }
  createLineOverlay(opts) {
    return new LWebglLineOverlay(opts).create().addTo(this).onAdd(this)
  }
  createDriveRoad(opts) {
    return new LDriveOverlay(opts).create().addTo(this).onAdd(this)
  }
  removeControl(ctrl) {
    this.mapCmp.removeControl(ctrl)
  }
  getMaxZoom() {
    return this.mapCmp.getMaxZoom()
  }
  getMinZoom() {
    return this.mapCmp.getMinZoom()
  }
  getZoom() {
    return this.mapCmp.getZoom()
  }
  zoomIn() {
    this.mapCmp.zoomIn()
  }
  zoomOut() {
    this.mapCmp.zoomOut()
  }
  setView(center, zoom) {
    this.mapCmp.setView(center, zoom)
  }
  fitBounds(bounds) {
    const me = this
    const map = me.mapCmp
    // 标准化输入
    const srcCrsCode = SYSTEM_CONFIG.CRS_CODE
    const destCrsCode = map.options.crs.code
    const ne = DataUtil.transform(bounds.north, bounds.east, srcCrsCode, destCrsCode)
    const sw = DataUtil.transform(bounds.south, bounds.west, srcCrsCode, destCrsCode)

    const northEast = L.latLng(ne.lat, ne.lng)
    const southWest = L.latLng(sw.lat, sw.lng)
    const latLngBounds = L.latLngBounds(northEast, southWest)
    this.mapCmp.fitBounds(latLngBounds)
  }
  remove() {
    this.mapCmp.off('mousemove click', this._onMapMouseMoveClick)
    this.mapCmp.off('movestart', this._onMapMoveStart)
    this.mapCmp.off('movesend', this._onMapMoveEnd)

    this.mapCmp.off('baselayerchange', this.__baseLayerChange, this)
    this.mapCmp.off('crschange', this.__crsChange, this)

    this.mapCmp.remove()
    super.remove()
  }
  addMarker(latLng, opts) {
    return new LMarker(latLng, opts).create().addTo(this).onAdd()
  }
  __baseLayerChange(e) {
    const me = this
    me.fire('baselayerchange', {
      layer: e.layer,
      originalEvent: e.originalEvent
    })
  }
  getCrsCode() {
    return this.mapCmp.options.crs.code
  }
  __crsChange(e) {
    const me = this
    me.fire('crschange', {
      layer: e.layer,
      originalEvent: e.originalEvent
    })
  }
  addTileLayer(tileLayer) {
    this.mapCmp.addLayer(tileLayer._lcmp)
  }
  removeTileLayer(tileLayer) {
    this.mapCmp.removeLayer(tileLayer._lcmp)
  }
  // 此方法是对 leaflet的一个封装，把Event转化并调用真正的业务方法
  _onMap(e) {
    this.onMapMouseMove({
      originalEvent: e.originalEvent,
      latLng: {
        lat: e.latLng.lat,
        lng: e.latLng.lng
      },
      point: {
        x: e.containerPoint.x,
        y: e.containerPoint.y
      },
      type: e.type,
      target: e.target
    })
  }
  // 此方法是对 leaflet的一个封装，把Event转化并调用真正的业务方法
  _onMapMouseMoveClick(e) {
    const newEvent = {
      originalEvent: e.originalEvent,
      latlng: {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      },
      point: {
        x: e.containerPoint.x,
        y: e.containerPoint.y
      },
      type: e.type,
      target: e.target
    }
    if (e.type === 'click') {
      this.onMapClick(newEvent)
    } else {
      this.onMapMouseMove(newEvent)
    }
  }
}
