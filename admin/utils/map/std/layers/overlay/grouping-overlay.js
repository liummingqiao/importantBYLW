import CanvasOverlay from './canvas-overlay'

const DEFAULT_OPTIONS = {
  name: '',
  // 默认样式，当不匹配任何legend时使用
  style: {
    color: 'gray'
  },
  legends: {
    // key: {
    //   visible: true,
    //   color: 'gray',
    //   opacity: 1.0   // 不设置则从options.opacity继承而来
    // },
    // key2: {
    //   visible: true,
    //   color: 'gray',
    //   opacity: 1.0   // 不设置则从options.opacity继承而来
    // }
  }
}
class GroupingOverlay extends CanvasOverlay {
  /**
   * 栅格数据渲染图层， canvas 2d 技术
   * @constructs GroupingOverlay
   * @extends CanvasOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {string} [opts.name] Overlay的名称，当Overlay注册到Legend control 时，使用该名称作为 分组名
   * @param {object} [opts.style] 默认样式
   * @param {string|RGB} [opts.style.color=gray] 未配置legend时的默认样式
   * @param {object} [opts.legends] <strong style="color: red;">重要</strong>： 数据分层显示的图例样式, 详见示例
   * @example
   {
     name: '分组示例',
     opacity: 0.7,
     style: {
       color: 'red'
     },
     legends: {
       '<=-110': {  // 每个key对应 store中的一个 Group
         color: '#ff0000'
       },
       '(-110,-105]': {
         color: '#ff00ff'
       },
       '(-105,-100]': {
         color: '#ffff00'
       },
       '(-100,-95]': {
         color: '#80ffff'
       },
       '(-95,-85]': {
         color: '#0000ff'
       },
       '(-85,-75]': {
         color: '#00ff00'
       },
       '>-75': {
         color: '#008000'
       }
      }
   }
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts, {
      style: Object.assign({}, DEFAULT_OPTIONS.style, opts.style),
      legends: Object.assign({}, DEFAULT_OPTIONS.legends, opts.legends)
    }))
  }
  /**
   * 获得Overlay 名称
   * @returns {string}
   */
  getName() {
    return this.options.name
  }
  /**
   * 获得Legend 分组的样式
   * @param {string} legendKey
   * @returns {object} 单个legend的样式
   */
  getLegendStyle(legendKey) {
    return this.options.legends[legendKey] || this.options.style
  }
  /**
   * 获得legends 完整配置
   * @returns {object}
   */
  getLegends() {
    return this.options.legends
  }
  bindStore(store) {
    super.bindStore(store)
    this._compileLegend(store)
  }
  _compileLegend(store) {
    const options = this.options
    const groups = store.getGroups()
    const legends = options.legends
    let aLegend

    // 使用默认样式补全legend
    Object.keys(groups).forEach(function(groupKey, idx) {
      aLegend = legends[groupKey]
      if (aLegend) {
        aLegend.color = aLegend.color || options.style.color
        aLegend.idx = idx
        aLegend.opacity = aLegend.opacity === undefined ? options.opacity : aLegend.opacity
        aLegend.visible = aLegend.visible === undefined ? options.visible : aLegend.visible
      } else {
        aLegend = {
          visible: options.visible,
          color: options.style.color,
          idx: idx,
          opacity: options.opacity
        }
        legends[groupKey] = aLegend
      }
    })

    Object.keys(legends).forEach(function(legendKey) {
      // 当配置了比数据更多的的legend，则初始化一些legend的值
      if (!groups[legendKey]) {
        aLegend = legends[legendKey]
        aLegend.color = aLegend.color || options.style.color
        aLegend.idx = -1
        aLegend.opacity = aLegend.opacity === undefined ? options.opacity : aLegend.opacity
        aLegend.visible = aLegend.visible === undefined ? options.visible : aLegend.visible
      }
    })
  }
  /**
   * 设置透明度，支持单个legend的透明度设置
   * @param {float} opacity 透明度, 有效范围 0~1
   * @param {string} [legendKey] 空值修改整体透明度，带legendKey则修改此legend的透明度
   */
  setOpacity(opacity, legendKey) {
    if (legendKey !== undefined) {
      if (this.options.legends[legendKey]) {
        this.options.legends[legendKey].opacity = opacity
      } else {
        console.error(`legendKey[${legendKey}] is not found`)
      }
    } else {
      Object.values(this.options.legends).forEach(function(legend) {
        legend.opacity = opacity
      })
    }
  }
  /**
   * 设置是否课件，支持单个legend的可见设置
   * @param {boolean} visible 可见设置
   * @param {string} [legendKey] 空值修改整体可见，带legendKey则修改此legend的可见
   */
  setVisible(visible, legendKey) {
    let oldVisible
    if (legendKey !== undefined) {
      if (this.options.legends[legendKey]) {
        oldVisible = this.options.legends[legendKey].visible
        this.options.legends[legendKey].visible = visible

        // 当有一个子层可见，设置整个layer可见
        if (visible) {
          this.options.visible = visible
          this._canvas.style.display = visible ? 'block' : 'none'
          if (this._opCanvas) {
            this._opCanvas.style.opacity = visible ? 'block' : 'none'
          }
        }

        if (oldVisible !== visible) {
          this.fire('visiblechange', {
            oldValue: oldVisible,
            newValue: visible
          })
        }
      } else {
        console.error(`legendKey[${legendKey}] is not found`)
      }
    } else {
      let legendVisibleChanged = false
      Object.values(this.options.legends).forEach(function(legend) {
        if (legend.visible !== visible) {
          legendVisibleChanged = true
        }
        legend.visible = visible
      })
      oldVisible = this.options.visible
      this._canvas.style.display = visible ? 'block' : 'none'
      if (this._opCanvas) {
        this._opCanvas.style.opacity = visible ? 'block' : 'none'
      }

      this.options.visible = visible

      if (oldVisible !== visible || legendVisibleChanged) {
        this.fire('visiblechange', {
          oldValue: !!visible,
          newValue: visible
        })
      }
    }
  }
}

export default GroupingOverlay
