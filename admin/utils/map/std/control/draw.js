import MapComponent from '../map-component'

const DEFAULT_OPTIONS = {
  visible: true,
  position: 'topright',
  drawPolyline: true,
  drawRectangle: true,
  drawPolygon: true,
  color: '#1890ff',
  weight: 2,
  opacity: 1.0,
  fillColor: '#1890ff',
  fillOpacity: 0.3
}

/**
 * 绘制组件的基类
 * @extends MapComponent
 */
class Draw extends MapComponent {
  /**
   * @event Draw#hide
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 组件本身
   */
  /**
   * @event Draw#show
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 组件本身
   */
  /**
   * @event Draw#startdraw
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 组件本身
   */
  /**
   * @event Draw#enddraw
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 组件本身
   */
  events = ['hide', 'show', 'startdraw', 'enddraw']
  /**
   * @constant
   * @property {string} CONTROL_KEY=draw 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'draw'
  /**
   * 创建绘制组件
   * @param {object} opts - 组件初始化配置
   * @param {boolean} [opts.visible=true] 组件是否可见
   * @param {Position} [opts.position=topright] 组件在地图的位置
   * @param {boolean} [opts.drawPolyline=true] 显示绘制线段按钮
   * @param {boolean} [opts.drawRectangle=true] 显示绘制矩形按钮
   * @param {boolean} [opts.drawPolygon=true] 显示绘制多边形按钮
   * @param {string} [opts.color=#1890ff] 线条颜色，十六进制颜色值
   * @param {number} [opts.weight=2] 线条宽度
   * @param {number} [opts.opacity=1.0] 线条透明度，0 ~ 1.0
   * @param {string} [opts.fillColor=#1890ff] 填充色，十六进制颜色值
   * @param {number} [opts.fillOpacity=0.3] 填充色透明度，0 ~ 1.0
   * @constructs Draw
   * @memberof std/control/
   */
  constructor(opts) {
    super(opts)

    this.options = Object.assign({}, DEFAULT_OPTIONS, opts)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    // 与 测量控件 互斥
    this.on('startdraw', function(e) {
      if (mapWrapper.controls.measure) {
        mapWrapper.controls.measure.disableMeasure()
      }
    }, this)
  }
  /**
   * 显示绘制组件
   */
  show() {
    this._show()
    this.fire('show')
  }
  /**
   * 隐藏绘制组件
   */
  hide() {
    this._hide()
    this.fire('hide')
  }
  /**
   * 设置组件的可见性
   * @param {boolean} visible - 是否可见，[true, false]
   */
  setVisible(visible) {
    if (visible) {
      this.show()
    } else {
      this.hide()
    }
  }
  onRemove() {
    delete this.mapWrapper.controls[this.CONTROL_KEY]
    super.onRemove()
  }
  /**
   * 禁用绘制功能
   */
  disableDraw() {

  }
  /**
   * 设置GeoJSON到组件
   * @param {object} data - GeoJSON格式数据
   */
  setGeoJSON(data) {

  }
  /**
   * 添加GeoJSON到组件
   * @param {object} data - GeoJSON格式数据
   */
  addGeoJSON(data) {

  }
  /**
   * 获取组件当前的GeoJSON格式数据
   * @return {object}
   */
  getGeoJSON() {

  }
  /**
   * 清空组件上的所有图形
   */
  clear() {

  }
  /**
   * 移除图形
   * @param {Function} filter 匹配图形的函数，每个图形都进行一次filter校验
   * Function参数： feature: 遍历的图形数据（GeoJSON格式） <br />
   * 返回值: <strong>true</strong>-图形匹配, 移除<strong>false</strong>-图形不匹配，不移除
   * @example
   draw.removeGeoJSON(function(feature) {
    return feature['properties']['adcode'] === 310000
   })
   */
  removeGeoJSON(filter) {

  }
  /**
   * 获取当前所有图形的边界
   * @returns {Bounds}
   */
  getBounds() {

  }
}

export default Draw
