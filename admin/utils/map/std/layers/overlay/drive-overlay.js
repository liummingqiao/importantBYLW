import BaseOverlay from './base-overlay'
import { DomUtil } from '../../util/dom-util'
import BaseStore from '../../store/base-store'
import DataUtil from '../../util/data-util'

const BASE_CLASS = 'fm-drive-container'

const DEFAULT_OPTIONS = {
  isLayer: true,
  visible: true,
  opacity: 0.6,
  simplify: true,
  tolerance: 0.00001,
  stroke: 'blue',
  strokeWidth: 3,
  markerStrokeWidth: 3,
  markerStroke: 'red'
}

class DriveOverlay extends BaseOverlay {
  /**
   * DriveOverlay类, 进行图层Drive路径画图
   *
   * @constructs DriveOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {boolean} [opts.isLayer=true] 标识符
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  buildUI() {
    // this._container = DomUtil.create('div', BASE_CLASS)
    this._svg = DomUtil.create('svg', BASE_CLASS + '-svg', undefined, 'http://www.w3.org/2000/svg')
    this._svg.setAttribute('version', '1.1')
    this._svg.setAttribute('pointer-events', 'none')
    this._svg.style.opacity = this.options.opacity
    this._svg.style.display = this.options.visible ? 'block' : 'none'
    this._path = DomUtil.create('path', BASE_CLASS + '-path', this._svg, 'http://www.w3.org/2000/svg')
    // this._path.setAttribute('d', 'M10 80 L77.5 10, 145 80, 280 80')
    this._path.setAttribute('stroke', this.options.stroke)
    this._path.setAttribute('stroke-width', this.options.strokeWidth)
    this._path.setAttribute('fill', 'none')
    this._path.style.strokeDasharray = '40 20'
    const markers = []
    // 创建5个 动画 marker
    let marker
    for (let i = 0; i < 5; i++) {
      marker = DomUtil.create('path', '', this._svg, 'http://www.w3.org/2000/svg')
      marker.setAttribute('d', 'M -20 -10 L 0 0  L -20 10')
      marker.setAttribute('stroke-width', this.options.markerStrokeWidth)
      marker.setAttribute('stroke', this.options.markerStroke)
      marker.setAttribute('fill', 'none')
      markers.push(marker)
    }
    this._markers = markers

    return this._svg
  }
  unbindStore() {
    this.store.off('refresh', this.repaint, this)
    this.store.off('filter filtercancel', this._storeFiltered, this)
  }
  bindStore(store) {
    if (this.store) {
      this.store.onUnbind(this)
      this.unbindStore()
    }

    store.onBeforeBind(this)
    this.store = store

    store.on('refresh', this._storeRefresh, this)
    store.on('filter filtercancel', this._storeFiltered, this)
    store.onBind(this)
    this._onStoreBind(store)
  }
  _onStoreBind(store) {
    this._storeRefresh()
    this.fire('storechange', { store: store })
  }
  _storeRefresh() {
    if (this.options.simplify) {
      this._simplify()
    }
    this.repaint()
  }
  _simplify() {
    const store = this.store
    const points = []
    store.getRows().forEach(function(row) {
      points.push([row.compiledLatLng.lng, row.compiledLatLng.lat])
    })
    this.simplified = DataUtil.simplify(points, this.options.tolerance)
  }
  onDraw(param) {
    const me = this
    const store = this.store

    if (!this.options.visible || !this.store) {
      return
    }

    let path = ''
    let point

    if (me.options.simplify) {
      me.simplified.forEach(function(row, idx) {
        point = me.latLngToPoint({ lat: row[1], lng: row[0] })
        if (idx === 0) {
          path = `M${point.x} ${point.y} L`
        } else {
          path += ` ${point.x} ${point.y}`
        }
      })
    } else {
      store.getRows().forEach(function(row, idx) {
        point = me.latLngToPoint(row.compiledLatLng)
        if (idx === 0) {
          path = `M${point.x} ${point.y} L`
        } else {
          path += ` ${point.x} ${point.y}`
        }
      })
    }

    me._path.setAttribute('d', path)
    const len = this._path.getTotalLength()
    const duration = len / 200
    me._markers.forEach(function(marker, idx) {
      marker.style.offsetPath = `path('${path}')`
      marker.style.animation = `drive-marker${idx} ${Math.max(duration, 2)}s linear normal infinite`
    })
  }
  /**
   * 由数据和配置创建store，并绑定到overlay
   * @param {any[][]} data 数据格式 参考 [std/store/BaseStore]{@link BaseStore}
   * @param {object} [storeCfg] stroe配置 参考 [std/store/BaseStore]{@link BaseStore}
   */
  setData(data, storeCfg) {
    this.bindStore(new BaseStore(data, storeCfg))
  }
  /**
   * 设置 overlay 整体 透明度
   * @param {float} opacity 0~1 之间的浮点型
   */
  setOpacity(opacity) {

  }
  /**
   * 设置 overlay 整体 是否可见
   * @param {boolean} visible
   */
  setVisible(visible) {

  }
  _compressData(data) {
    return data
  }
  /**
   * 获得当前 overlay 可见属性
   * @returns {boolean}
   */
  isVisible() {
    return this.options.visible
  }
  latLngToPoint(latLng) {
    // 交互类实现
  }
}

export default DriveOverlay
