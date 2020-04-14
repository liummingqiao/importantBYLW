import CanvasOverlay from './canvas-overlay'

const DEFAULT_OPTIONS = {
  gradient: { 0.25: 'rgb(0,0,255)', 0.55: 'rgb(0,255,0)', 0.85: 'yellow', 1.0: 'rgb(255,0,0)' },
  visible: true,
  clickable: false,
  // radius should be small ONLY if scaleRadius is true (or small radius is intended)
  // if scaleRadius is false it will be the constant radius used in pixels
  'radius': 20,
  opacity: 0.7,
  // scales the radius based on map zoom
  'scaleRadius': false,
  // if set to false the heatmap uses the global maximum for colorization
  // if activated: uses the data maximum within the current map boundaries
  //   (there will always be a red spot with useLocalExtremas true)
  'useLocalExtrema': false,
  // 聚合范围的数量大于该值的都为红色
  maxCount: 10,
  // which field name in your data represents the latitude - default "lat"
  latField: 'lat',
  // which field name in your data represents the longitude - default "lng"
  lngField: 'lng',
  // which field name in your data represents the data value - default "value"
  valueField: 'count'
}

class HeatmapOverlay extends CanvasOverlay {
  /**
   * 热力图渲染 overlay, <br />
   * 热力图特点: 不可点击，可根据地图经纬度距离，屏幕像素距离进行渲染
   *
   * @constructs HeatmapOverlay
   * @extends CanvasOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {boolan} [opts.scaleRadius=false] true, 根据经纬度距离渲染热力图效果， false，根据像素距离渲染热力图效果
   * @param {float} [opts.radius=20] 当使用经纬度距离时， radius表示经纬度，单位: degrees； 当使用像素距离时， radius表示像素， 单位: pixel
   * @param {float} [opts.opacity=0.7] 默认热力图最高透明度 0.7
   * @param {integer} [opts.maxCount=10] 聚合范围内最大值颜色的阈值，例如，梯度最高是红色，maxCount=10, 当聚合范围内的点超过10，渲染为红色
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  uiHook() {
    // heatmap 不支持点击
    return undefined
  }
  buildCanvas() {
    // heatmap 另行创建 canvas, 暂时不对 heatmap 统一封装
    return undefined
  }

  bindStore(store) {
    const me = this
    super.bindStore(store)
    me._compileData()
    me._onStoreBind(store)
  }
  _compileData() {
    const me = this
    const store = me.store

    const heatMapData = []
    store.getRows().forEach(function(row) {
      if (row._filtered === false) {
        return
      }
      heatMapData.push({
        lat: row.compiledLatLng.lat,
        lng: row.compiledLatLng.lng,
        count: store.fetch(row, 'count') || 1
      })
    })

    me._setDrawData({
      max: this.options.maxCount,
      data: heatMapData
    })
  }
  _storeFiltered(e) {
    const me = this
    me._compileData()
    super._storeFiltered(e)
  }
  setOpacity(opacity) {
    this.getContainerElement().style.opacity = opacity
  }

  setVisible(visible) {
    this.getContainerElement().style.display = visible ? 'block' : 'none'
    this.options.visible = visible
  }
  _setDrawData(data) {
    // 底层设置到 heatmap 组件中
  }
}

export default HeatmapOverlay
