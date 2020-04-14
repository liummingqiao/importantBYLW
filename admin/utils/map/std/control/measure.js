import Panel from './panel'
import { DomUtil, DomEvent } from '../util/dom-util'

const BASE_CLASS = 'fm-measure'
const DEFAULT_OPTIONS = {
  header: {
    icon: '/static/icons/map/ruler_icon.svg',
    title: locales.toolbar.measure
  },
  position: 'topright'
}

/**
 * 测量组件的基类
 * @extends Panel
 */
class Measure extends Panel {
  /**
   * @event Measure#startmeasure
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 组件本身
   */
  /**
   * @event Measure#endmeasure
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 组件本身
   */
  events = ['startmeasure', 'endmeasure']
  /**
   * @constant
   * @property {string} CONTROL_KEY=measure 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'measure'
  /**
   * 创建测量组件
   * @param {object} opts - 组件初始化配置
   * @param {boolean} [opts.visible=true] 组件是否可见
   * @param {Position} [opts.position=topright] 组件在地图的位置
   * @param {boolean} [opts.closeButton=true] 显示关闭按钮
   * @param {boolean} [opts.hideOnClose=true] 点击关闭按钮隐藏组件，设置成false将销毁组件
   * @param {boolean} [opts.dragable=true] 组件是否可拖动
   * @param {boolean} [opts.resizable=false] 组件是否可缩放
   * @constructs Measure
   * @memberof std/control/
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    this.onAdd(mapWrapper)
    // 与 绘制控件 互斥
    this.on('startmeasure', function(e) {
      if (mapWrapper.controls.draw) {
        mapWrapper.controls.draw.disableDraw()
      }
    }, this)
  }
  bodyHook() {
    const me = this
    const bodyEl = me.bodyEl = DomUtil.create('div', BASE_CLASS)
    // 测距按钮
    const lengthA = DomUtil.create('button', 'fm-common-button fm-common-button--primary fm-common-button--mini', bodyEl)
    const lengthSpan = DomUtil.create('span', undefined, lengthA)
    lengthSpan.innerHTML = locales.measure.length
    DomEvent.on(lengthA, 'click', me._onLengthBtnClick, me)
    // 测面积按钮
    const areaA = DomUtil.create('button', 'fm-common-button fm-common-button--primary fm-common-button--mini', bodyEl)
    const areaSpan = DomUtil.create('span', undefined, areaA)
    areaSpan.innerHTML = locales.measure.area
    DomEvent.on(areaA, 'click', me._onAreaBtnClick, me)
    // 清除按钮
    const cleanA = DomUtil.create('button', 'fm-common-button fm-common-button--danger fm-common-button--mini', bodyEl)
    const cleanSpan = DomUtil.create('span', undefined, cleanA)
    cleanSpan.innerHTML = locales.measure.clear
    DomEvent.on(cleanA, 'click', me._onCleanBtnClick, me)
    return bodyEl
  }
  onRemove() {
    delete this.mapWrapper.controls[this.CONTROL_KEY]
    super.onRemove()
  }
  /**
   * 禁用测量功能
   */
  disableMeasure() {

  }
}

export default Measure
