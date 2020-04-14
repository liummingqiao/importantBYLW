import Panel from './panel'
import { DomUtil, DomEvent } from '../util/dom-util'
import Clipboard from 'clipboard'

const BASE_CLASS = 'fm-coord-picker'
const DEFAULT_OPTIONS = {
  header: {
    icon: '/static/icons/map/picker_icon.svg',
    title: locales.toolbar.pickup
  },
  position: 'topright',
  visible: true,
  closeButton: true,
  hideOnClose: true,
  dragable: true,
  resizable: false
}

/**
 * 坐标拾取组件的基类
 * @extends Panel
 */
class CoordPicker extends Panel {
  /**
   * @constant
   * @property {string} CONTROL_KEY=coordPicker 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'coordPicker'
  /**
   * 创建坐标拾取组件
   * @param {object} opts - 组件初始化配置
   * @param {boolean} [opts.visible=true] 组件是否可见
   * @param {Position} [opts.position=topright] 组件在地图的位置
   * @param {boolean} [opts.closeButton=true] 显示关闭按钮
   * @param {boolean} [opts.hideOnClose=true] 点击关闭按钮隐藏组件，设置成false将销毁组件
   * @param {boolean} [opts.dragable=true] 组件是否可拖动
   * @param {boolean} [opts.resizable=false] 组件是否可缩放
   * @constructs CoordPicker
   * @memberof std/control/
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    this.onAdd(mapWrapper)
  }
  bodyHook() {
    const me = this
    const bodyEl = me.bodyEl = DomUtil.create('div', BASE_CLASS)

    // 经纬度
    const coord = me._coordEl = DomUtil.create('input', BASE_CLASS + '-coord', bodyEl)
    coord.readOnly = true

    // 操作按钮
    const toolbarDiv = DomUtil.create('div', BASE_CLASS + '-toolbar', bodyEl)
    // 拾取
    const pickBtn = DomUtil.create('button', 'fm-common-button fm-common-button--primary fm-common-button--mini', toolbarDiv)
    const pickSpan = DomUtil.create('span', undefined, pickBtn)
    pickSpan.innerHTML = locales.coordPicker.pickup
    DomEvent.on(pickBtn, 'click', me._onPickBtnClick, me)
    // 复制
    const copyBtn = DomUtil.create('button', 'fm-common-button fm-common-button--primary fm-common-button--mini', toolbarDiv)
    const copySpan = DomUtil.create('span', undefined, copyBtn)
    copySpan.innerHTML = locales.coordPicker.copy
    DomEvent.on(copyBtn, 'click', me._onCopyBtnClick, me)
    return bodyEl
  }

  _onPickBtnClick(e) {
    // 在子类实现具体的激活拾取操作
  }

  _onCopyBtnClick(event) {
    const me = this
    const clipboard = new Clipboard(event.target, {
      text: () => me._coordEl.value
    })
    clipboard.on('success', () => {
      me.fire('copysuccess')
      clipboard.destroy()
    })
    clipboard.on('error', () => {
      me.fire('copyerror')
      clipboard.destroy()
    })
    clipboard.onClick(event)
  }

  updateCoord(coord) {
    const me = this
    const coordText = coord.lng.toFixed(6).concat(', ').concat(coord.lat.toFixed(6))
    me._coordEl.value = coordText
  }
  onRemove() {
    delete this.mapWrapper.controls[this.CONTROL_KEY]
    super.onRemove()
  }
}

export default CoordPicker
