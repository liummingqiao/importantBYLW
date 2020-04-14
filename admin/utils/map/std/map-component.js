import { DomUtil, DomEvent } from './util/dom-util'
import Evented from './util/evented'

class MapComponent extends Evented {
  // 组件被删除时触发
  /**
   * @event MapComponent#remove
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 触发事件的元素
   */
  events = ['remove']
  mapWrapper = undefined
  /**
  * 地图组件的基类
  * @constructs MapComponent
  * @memberof std/
  * @extends Evented
  */
  constructor(opts) {
    super()
    this.options = opts
  }
  /**
   * 此方法返回最终渲染在地图控件上的最外层容器，可用于处理改变大小，移动等操作
   * @returns {HTMLElement}
   */
  getContainerElement() {
    // 此方法返回最终渲染在地图控件上的最外层容器，用于处理改变大小，移动等操作
  }
  /**
   * 创建特定引擎的组件以及辅助创建该组件的动作
   * @abstract
   * @return {MapComponent}
   */
  create() {
    // 此方法负责创建 特定引擎的组件以及 辅助创建该组件的动作
    throw new Error('create() must be implemented in sub class!')
  }
  /**
   * 将组建添加到 指定的 map wrapper容器中
   * @param {MapWrapper} mapWrapper
   * @return {MapComponent}
   */
  addTo(mapWrapper) {
    this.mapWrapper = mapWrapper
    mapWrapper.beforeLayerAdd(this)
    return this
    // 此方法负责将地图组件加入到指定的地图容器中
  }
  /**
   * <strong>手动将组建添加到 指定的 map wrapper容器后，务必调用，不少组件通过 onAdd方法初始化 配置</strong>
   * @param {MapWrapper} mapWrapper
   * @returns {MapComponent}
   */
  onAdd(mapWrapper) {
    // add控件到地图后调用此方法, 通常是 addTo 方法之后
    return this
  }
  buildUI() {
    this._content = DomUtil.create('div', 'fm-cmp')
    const hook = this.uiHook()

    // L.DomEvent.disableClickPropagation(this._content)
    DomEvent.disableClickPropagation(this._content)
    if (hook) {
      this._content.appendChild(hook)
    }
    return this._content
  }
  /**
   * 返回HTMLElement会append到UI元素，undefined则忽略
   * 可自定义组件的基础 HTMLElement
   * @returns {HTMLElement|undefined}
   */
  uiHook() {
  }
  _getMapContainer() {
    return this.mapWrapper.mapCmp._container
  }
  /**
   * 在地图组件上清除本控件
   */
  destroy() {
    // 删除控件时执行的方法
    this.onRemove()
  }
  onRemove() {
    // 删除后执行的方法，一般用作事件触发
    this.mapWrapper.beforeLayerRemove(this)
    this.fire('remove')
  }
}

export default MapComponent
