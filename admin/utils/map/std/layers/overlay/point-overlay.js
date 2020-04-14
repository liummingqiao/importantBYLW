import GroupingOverlay from './grouping-overlay'
import mixin from '../../util/mixin'
import PointInteract from './point-interact'

const DEFAULT_OPTIONS = {
  realResponse: true,
  offsetX: 0,
  offsetY: 0,
  clickable: true,
  clickType: 1, // 1: 表示所有符合的数据都会被点中，并返回数据， 2: 仅返回点中数据的第一条， 3: 仅返回点中数据的最后一条
  getDrawSize: undefined
}

export default class PointOverlay extends mixin(GroupingOverlay, PointInteract) {
  /**
   * 元素被点中后触发
   * @event PointOverlay#itemclick
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {any[][]} data 被点中的数据
   * @property {ref} event.target 元素本身
   */
  /**
   * 新点击时，老的被点中数据在操作层被清理时触发
   * @event PointOverlay#itemcancel
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {any[][]} data 被清理的数据
   * @property {ref} event.target 元素本身
   */
  events = ['itemclick', 'itemcancel']

  /**
   * 点数据渲染图层， canvas 2d 技术
   * @constructs PointOverlay
   * @extends GroupingOverlay
   * @memberof std/layers/overlay/
   * @mixes PointInteract
   * @param {object} opts
   * @param {boolean} [opts.clickable=true] 是否支持点击
   * @param {integer} [opts.clickType=1] 1: 表示所有符合的数据都会被点中，并返回数据， 2: 仅返回点中数据的第一条， 3: 仅返回点中数据的最后一条
   * @param {object} [opts.legends] <strong style="color: red;">重要</strong>： 数据分组显示的图例样式, 请参考 [std/layers/overlay/GroupingOverlay]{@link GroupingOverlay}
   * @param {boolean} [opts.realResponse=true] 仅当 offsetX或者offsetY 生效时有区别；true：响应真实坐标点位置的事件， false：响应偏移之后的事件
   * @param {integer} [opts.offsetX=0] 配置数据点渲染时的 x 轴偏移量，单位: pixel
   * @param {integer} [opts.offsetY=0] 配置数据点渲染时的 y 轴偏移量，单位: pixel
   * @param {Function} [opts.getDrawSize] 配置绘制点的大小, 参数： zoom 地图缩放级
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  lastClickedData = undefined
  bindStore(store) {
    super.bindStore(store)
    this._onStoreBind(store)
  }
  onDraw(param) {
    const me = this
    const canvas = me._canvas
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!me.store || me.store.getSize() === 0 || !me.options.visible) {
      return
    }

    const zoom = param.zoom
    const store = me.store

    const options = me.options
    const radius = me.getDrawSize(zoom) / 2
    const legends = options.legends

    let point
    let color
    let aLegend
    let group
    let groupData

    Object.keys(legends).forEach(function(legendKey) {
      aLegend = legends[legendKey]
      if (!aLegend.visible) {
        return
      }

      color = me.COLOR_SETTING.transform(aLegend.color)
      group = store.getGroup(legendKey)
      groupData = group ? group.getData() : []

      groupData.forEach(function(row) {
        if (row._filtered === false || !me.isInView(row.compiledLatLng)) {
          return
        }
        point = me.latLngToPoint(row.compiledLatLng)
        me.drawCircle(ctx, point, radius, color, aLegend.opacity)
      })
    })
  }
  onOpDraw(param) {
    const me = this
    const options = me.options
    const data = me.lastClickedData

    if (!options.visible || !me._opCanvas || !data) {
      return
    }

    const canvas = me._opCanvas
    const context = canvas.getContext('2d')
    // const showLabel = options.showLabel
    const store = me.store
    const zoom = param.zoom
    const radius = me.getDrawSize(zoom) * 0.75
    const legends = options.legends

    context.clearRect(0, 0, canvas.width, canvas.height)

    let point
    let aLegend
    let color
    data.forEach(function(row) {
      if (row._filtered === false) {
        return
      }

      point = me.latLngToPoint(row.compiledLatLng)
      aLegend = legends[store.fetchGroup(row)]

      if (!aLegend.visible) {
        return
      }
      color = me.COLOR_SETTING.transform(aLegend.color)

      context.beginPath()
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
      // context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${aLegend.opacity})`
      context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`
      context.fill()
      context.lineWidth = 1
      context.strokeStyle = '#003300'
      context.stroke()
      context.closePath()
    })
  }
  drawCircle(ctx, pixel, radius, color, opacity, withStroke) {
    ctx.beginPath()
    ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2, false)
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`
    ctx.fill()
    ctx.closePath()

    if (withStroke) {
      ctx.stroke()
    }
  }
  getDrawSize(zoom) {
    if (this.options.getDrawSize) {
      return this.options.getDrawSize.call(this, zoom)
    }

    let size = 1.0
    switch (zoom) {
      case 14:
        size = zoom - 3.0
        break
      case 15:
        size = zoom - 2.0
        break
      case 16:
        size = zoom - 1.0
        break
      case 17:
        size = zoom + 1.0
        break
      case 18:
        size = zoom + 2.0
        break
      default:
        size = zoom - 4.0
        break
    }
    size = Math.max(size, 1.0)
    return size
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

  _onMapClick(latLng, point) {
    if (this.options.realResponse && (this.options.offsetX || this.options.offsetY)) {
      const newPoint = {
        x: point.x - this.options.offsetX,
        y: point.y - this.options.offsetY
      }
      latLng = this.mapWrapper.mapCmp.containerPointToLatLng(newPoint)
    }

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
