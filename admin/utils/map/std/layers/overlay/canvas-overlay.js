import BaseOverlay from './base-overlay'
import { DomUtil } from '../../util/dom-util'
import BaseStore from '../../store/base-store'

const DEFAULT_OPTIONS = {
  visible: true,
  opacity: 1.0
}

const BASE_CLASS = 'fm-canvas-overlay'

class CanvasOverlay extends BaseOverlay {
  /**
   * store 绑定后触发
   * @event CanvasOverlay#storechange
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 触发事件的元素
   */
  /**
   * 单个legend 或者整个 visible 改变时触发
   * @event CanvasOverlay#visiblechange
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {boolean} event.oldValue 旧值, 改变前
   * @property {boolean} event.newValue 旧值， 改变后
   * @property {ref} event.target 元素本身
   */
  events = ['storechange', 'visiblechange']
  /**
   * 使用 HTML CANVAS 元素渲染数据的 覆盖物基类
   *
   * @constructs CanvasOverlay
   * @extends BaseOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {boolean} [opts.visible=true] 默认可见
   * @param {float} [opts.opacity=1.0] 默认不透明
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  /**
   * 颜色支持属性
   * @constant
   * @property {object} COLOR_SETTING
   * @property {RGB} COLOR_SETTING.colorString 默认颜色文字支持，例如， COLOR_SETTING.red, 获取RGB数组 <br />
   * red: [0xFF, 0x00, 0x00],<br />
    green: [0x00, 0xFF, 0x00],<br />
    blue: [0x00, 0x00, 0xFF],<br />
    orange: [0xFF, 0x99, 0x00],<br />
    purple: [0x9C, 0x27, 0xB0],<br />
    white: [0xFF, 0xFF, 0xFF],<br />
    black: [0x00, 0x00, 0x00],<br />
    gray: [0x9E, 0x9E, 0x9E],<br />
    yellow: [0xFF, 0xFF, 0x00],<br />
    brown: [0xA5, 0x2A, 0x2A],<br />
    indigo: [0x4B, 0x00, 0x82],<br />
    deeppink: [0xFF, 0x14, 0x93]
   * @property {function} COLOR_SETTING.transform transform: function(rgbString) , 参数为 rgbString, 可以是 #bcbcbc, 也可以是 bcbcbc，转换为rgb数组 <br />
       return  {@link RGB}
   */
  COLOR_SETTING = {
    red: [0xFF, 0x00, 0x00],
    green: [0x00, 0xFF, 0x00],
    blue: [0x00, 0x00, 0xFF],
    orange: [0xFF, 0x99, 0x00],
    purple: [0x9C, 0x27, 0xB0],
    white: [0xFF, 0xFF, 0xFF],
    black: [0x00, 0x00, 0x00],
    gray: [0x9E, 0x9E, 0x9E],
    yellow: [0xFF, 0xFF, 0x00],
    brown: [0xA5, 0x2A, 0x2A],
    indigo: [0x4B, 0x00, 0x82],
    deeppink: [0xFF, 0x14, 0x93],
    default: [0x9E, 0x9E, 0x9E], // gray
    transform: function(rgbString) {
      if (typeof rgbString === 'object' && rgbString.constructor === Array && rgbString.length === 3) {
        return rgbString
      }
      if (this[rgbString]) { return this[rgbString] }

      var r, g, b
      if (rgbString.indexOf('#') === 0) {
        r = parseInt('0x' + rgbString.substring(1, 3), 16)
        g = parseInt('0x' + rgbString.substring(3, 5), 16)
        b = parseInt('0x' + rgbString.substring(5, 7), 16)
      } else if (rgbString.length === 6) {
        r = parseInt('0x' + rgbString.substring(0, 2), 16)
        g = parseInt('0x' + rgbString.substring(2, 4), 16)
        b = parseInt('0x' + rgbString.substring(4, 6), 16)
      } else {
        return this['default']
      }
      return [r, g, b]
    }
  }
  create() {
    this.buildUI()
  }
  buildUI() {
    this._canvas = this.buildCanvas()
    this._opCanvas = this.uiHook()
  }
  buildCanvas() {
    return DomUtil.create('canvas', BASE_CLASS)
  }
  uiHook() {
    return this.options.clickable ? DomUtil.create('canvas', BASE_CLASS + '-op') : undefined
  }
  /**
   * 当地图 拖动，zoom , resize时调用数据重画方法
   * @param {object} param
   * @param {object} param.canvas 当前会话的canvas 元素
   * @param {Bounds} param.bounds 当前地图可视区域 bounds, 格式 {
   *  north: bounds.getNorth(),
      south: bounds.getSouth(),
      west: bounds.getWest(),
      east: bounds.getEast()
    }
   * @param {integer} param.zoom 当前地图的缩放级别
   * @param {Pixel} param.size 地图控件的 宽高 {x: 800, y: 600}
   */
  onDraw(param) {
    // 标准数据作画
  }
  /**
   * 当地图 拖动，zoom , resize时调用操作重画方法
   * @param {object} param
   * @param {object} param.canvas 当前会话的canvas 元素
   * @param {Bounds} param.bounds 当前地图可视区域 bounds, 格式 {
   *  north: bounds.getNorth(),
      south: bounds.getSouth(),
      west: bounds.getWest(),
      east: bounds.getEast()
    }
   * @param {integer} param.zoom 当前地图的缩放级别
   * @param {Pixel} param.size 地图控件的 宽高 {x: 800, y: 600}
   */
  onOpDraw(param) {
    // 操作层作画
  }
  unbindStore() {
    this.store.off('refresh', this.repaint, this)
    this.store.off('filter filtercancel', this._storeFiltered, this)
  }
  /**
   * 为 overlay 绑定数据集 store
   * @param {BaseStore} store
   */
  bindStore(store) {
    if (this.store) {
      this.store.onUnbind(this)
      this.unbindStore()
    }

    store.onBeforeBind(this)
    this.store = store

    store.on('refresh', this.repaint, this)
    store.on('filter filtercancel', this._storeFiltered, this)
    store.onBind(this)
  }
  _storeFiltered(e) {
    this.repaint()
    this.fire('storechange', { store: this.store })
  }
  _onStoreBind(store) {
    this.repaint()
    this.fire('storechange', { store: store })
  }
  /**
   * 获取绑定的数据集 store
   * @returns {BaseStore}
   */
  getStore() {
    return this.store
  }
  getZoomDistance() {
    // 获取当前地图 zoom 级别 与最大级别差， 如果当前底图最大级别为17， 当前级别为15， 返回 17 - 15 = 2
    // 在最底层地图控件中实现
    throw new Error('CanvasOverlay.getZoomDistance() must be implemented!')
  }
  /**
   * 重画数据Canvas以及操作Canvas
   */
  repaint() {
    // 获取当前画图区域所在世界地图中的 offset
    // 在最底层地图控件中实现
    throw new Error('CanvasOverlay.repaint() must be implemented!')
  }
  /**
   * 重画操作Canvas
   */
  opRepaint() {
    // 单独触发 op层作画
    throw new Error('CanvasOverlay.opRepaint() must be implemented!')
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
   * 判断数据是否在可视区域内
   * @param {LatLng} latLng 数据格式 { lat: 22.23232, lng: 123.556212}
   * @returns {boolean}
   */
  isInView(latLng) {
    // 判断经纬度是否在可视范围内
    // 在最底层地图控件中实现
    throw new Error('CanvasOverlay.isInView() must be implemented!')
  }
  // latLng: 当前可视区域的topleft 坐标，数据类型 {lat : 23.11233, lng: 113.2333}
  _getProjectionOffset(latLng) {
    // 获取当前画图区域所在世界地图中的 offset
    // 在最底层地图控件中实现
    throw new Error('CanvasOverlay._getProjectionOffset() must be implemented!')
  }
  /**
   * 利用 latLng 转换成 当前map可视区域内的像素位置 {lat, lng} => {x, y}
   *
   * @param {LatLng} latLng 数据格式 { lat: 22.23232, lng: 123.556212}
   * @returns {Pixel} {x: 221, y: 582}
   */
  latLngToPoint(latLng) {
    // 在最底层依赖地图组件实现
    throw new Error('CanvasOverlay.latLngToPoint() must be implemented!')
  }
  /**
   * 本方法利用 像素距离 获得经纬度的距离，通常用于画图距离跟 地图距离的转换
   * 注意 ，返回值中的1表示1°， 在中国范围，大致约等于 100 KM
   *
   * @param {float} pixelDistance 屏幕上的 像素数
   * @returns {float}
   */
  pixelToDegrees(pixelDistance) {
    // 在最底层依赖地图组件实现
    throw new Error('CanvasOverlay.pixelToDegrees() must be implemented!')
  }
  onRemove() {
    super.onRemove()
    if (this.store) {
      this.store.onUnbind(this)
    }
  }
  setOpacity(opacity) {
    this._canvas.style.opacity = opacity
    if (this._opCanvas) {
      this._opCanvas.style.opacity = opacity
    }
  }

  setVisible(visible) {
    this._canvas.style.display = visible ? 'block' : 'none'
    if (this._opCanvas) {
      this._opCanvas.style.opacity = visible ? 'block' : 'none'
    }

    this.options.visible = visible
  }

  destroy() {
    // 底层 canvas 类负责清理 地图组件的内容
    super.destroy()
  }
}

export default CanvasOverlay
