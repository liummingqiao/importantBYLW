import MapComponent from '../../map-component'

const DEFAULT_OPTIONS = {
  isLayer: true
}

class BaseOverlay extends MapComponent {
  /**
   * Overlay 基本类
   *
   * @abstract
   * @constructs BaseOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {boolean} [opts.isLayer=true] 标识符
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
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
  /**
   * 获得当前 overlay 可见属性
   * @returns {boolean}
   */
  isVisible() {
    return this.options.visible
  }
}

export default BaseOverlay
