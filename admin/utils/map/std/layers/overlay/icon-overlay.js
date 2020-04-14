import PointOverlay from './point-overlay'
import { DomUtil } from '../../util/dom-util'

const DEFAULT_OPTIONS = {
  iconWidth: 16,
  iconHeight: 16,
  highlightScale: 1.5,
  defaultIcon: '/static/icons/default.png'
}

export default class IconOverlay extends PointOverlay {
  /**
   * 图标数据渲染图层， canvas 2d 技术
   * @constructs IconOverlay
   * @extends PointOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {integer} [opts.iconWidth=16] 绘制的Legend图片宽度
   * @param {integer} [opts.iconHeight=16] 绘制的Legend图片高度，单位: pixel
   * @param {float} [opts.highlightScale=1.5] 点中数据时数据的缩放比例
   * @param {string} [opts.defaultIcon=./icons/default.png] 当无法读取到Legend图片时，使用默认图片替代
   * @param {object} [opts.legends] <strong style="color: red;">重要</strong>： 数据分组显示的图例样式, 请参考 [std/layers/overlay/GroupingOverlay]{@link GroupingOverlay} <br />
   * <strong style="color: red;">与PointOverlay区别</strong>: legends配置中，不使用legend.color 渲染，使用 legend.icon='./url/name.png' 绘制图例
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  lastClickedData = undefined
  imageCheckFlag = {}
  ready = false
  _checkReady() {
    this.ready = !Object.values(this.imageCheckFlag).some(function(v) {
      return v === false
    })
    if (this.ready) {
      const me = this
      me.repaint()
    }
  }
  bindStore(store) {
    super.bindStore(store)
    const me = this
    me._onStoreBind(store)

    // fixed legend
    const legends = me.options.legends
    let aLegend

    const imageCheckFlag = me.imageCheckFlag
    const options = me.options

    Object.keys(legends).forEach(function(legendKey) {
      aLegend = legends[legendKey]
      imageCheckFlag[legendKey] = false
      aLegend.icon = aLegend.icon || options.defaultIcon
      aLegend.iconImg = DomUtil.create('img')
      aLegend.iconImg.src = aLegend.icon
      aLegend.iconImg.legendKey = legendKey
      aLegend.iconImg.onload = function() {
        me._onImageLoad(this)
      }
      aLegend.iconImg.onerror = function() {
        me._onImageError(this)
      }
    })
  }
  _onImageLoad(img) {
    this.imageCheckFlag[img.legendKey] = true
    this._checkReady()
  }
  _onImageError(img) {
    console.error(`${img.src} not found!`)
    img.src = this.options.defaultIcon
  }
  onDraw(param) {
    const me = this
    const canvas = me._canvas
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!this.ready) {
      return
    }
    if (!me.store || me.store.getSize() === 0 || !me.options.visible) {
      return
    }

    const store = me.store
    const options = me.options
    const legends = options.legends

    let point
    let aLegend
    let group
    let groupData

    Object.keys(legends).forEach(function(legendKey) {
      aLegend = legends[legendKey]
      if (!aLegend.visible) {
        return
      }

      group = store.getGroup(legendKey)
      groupData = group ? group.getData() : []

      groupData.forEach(function(row) {
        if (!me.isInView(row.compiledLatLng) || row._filtered === false) {
          return
        }
        point = me.latLngToPoint(row.compiledLatLng)
        me.drawImage(ctx, aLegend.iconImg, point, options.iconWidth, options.iconHeight, aLegend.opacity)
      })
    })
  }
  onOpDraw(param) {
    const me = this
    const options = me.options
    const data = me.lastClickedData
    const canvas = me._opCanvas
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!options.visible || !me._opCanvas || !data) {
      return
    }

    const store = me.store
    const legends = options.legends

    let point
    let aLegend
    data.forEach(function(row) {
      if (row._filtered === false) {
        return
      }

      point = me.latLngToPoint(row.compiledLatLng)
      aLegend = legends[store.fetchGroup(row)]

      if (!aLegend.visible) {
        return
      }
      me.drawImage(ctx, aLegend.iconImg, point, options.iconWidth * options.highlightScale, options.iconHeight * options.highlightScale, aLegend.opacity)
    })
  }
  getDrawSize() {
    return this.options.iconWidth
  }
  drawImage(ctx, img, pixel, width, height, opacity) {
    ctx.globalAlpha = opacity
    ctx.drawImage(img, pixel.x - width / 2, pixel.y - height / 2, width, height)
  }
  setVisible(visible, legendKey) {
    super.setVisible(visible, legendKey)
    this.repaint()
  }

  setOpacity(opacity, legendKey) {
    super.setOpacity(opacity, legendKey)
    this.repaint()
  }
  _onItemClick(data) {
    const me = this
    let responseData

    switch (me.options.clickType) {
      case 1:
        responseData = data
        break
      case 2:
        responseData = [data[0]]
        break
      case 3:
        responseData = [data[data.length - 1]]
        break
    }

    me.lastClickedData = responseData
    me.fire('itemclick', {
      data: responseData
    })
    me.opRepaint()
  }

  _onItemCancel() {
    const me = this
    const data = me.lastClickedData
    me.lastClickedData = undefined
    me.fire('itemcancel', {
      data: data
    })
    me.clearOpCanvas()
  }

  clearOpCanvas() {
    const me = this
    const canvas = me._opCanvas
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  _onMapClick(latLng) {
    const me = this
    const clickedData = me.impact(latLng, true)
    if (clickedData.length > 0) {
      me._onItemClick(clickedData)
    } else {
      if (me.lastClickedData) {
        me._onItemCancel()
      }
    }
  }
}
