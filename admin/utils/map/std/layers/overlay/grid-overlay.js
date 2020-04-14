import GroupingOverlay from './grouping-overlay'
import mixin from '../../util/mixin'
import GridInteract from './grid-interact'

const DEFAULT_OPTIONS = {
  realResponse: true,
  offsetX: 0,
  offsetY: 0,
  clickable: true,
  gridSize: 0.001,
  opacity: 0.7
}

class GridOverlay extends mixin(GroupingOverlay, GridInteract) {
  /**
   * 元素被点中后触发
   * @event GridOverlay#itemclick
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {any[][]} data 被点中的数据
   * @property {ref} event.target 元素本身
   */
  /**
   * 新点击时，老的被点中数据在操作层被清理时触发
   * @event GridOverlay#itemcancel
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {any[][]} data 被清理的数据
   * @property {ref} event.target 元素本身
   */
  events = ['itemclick', 'itemcancel']
  /**
   * 栅格数据渲染图层， canvas 2d 技术
   * @constructs GridOverlay
   * @extends GroupingOverlay
   * @memberof std/layers/overlay/
   * @mixes GridInteract
   * @param {object} opts
   * @param {boolean} [opts.clickable=true] 是否支持点击
   * @param {float} [opts.gridSize=0.001] 栅格大小，单位： degrees, , 一般默认 0.001 约等于100米
   * @param {float} [opts.opacity=0.7] 默认透明度， 有效范围： 0~1
   * @param {object} [opts.legends] <strong style="color: red;">重要</strong>： 数据分组显示的图例样式, 请参考 [std/layers/overlay/GroupingOverlay]{@link GroupingOverlay}
   * @param {boolean} [opts.realResponse=true] 仅当 offsetX或者offsetY 生效时有区别；true：响应真实坐标点位置的事件， false：响应偏移之后的事件
   * @param {integer} [opts.offsetX=0] 配置数据点渲染时的 x 轴偏移量，单位: pixel
   * @param {integer} [opts.offsetY=0] 配置数据点渲染时的 y 轴偏移量，单位: pixel
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

    const store = me.store

    const options = me.options
    const gridSize = me.options.gridSize
    const legends = options.legends

    let point1, point2
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
        if (row._filtered === false || !me.isInView(row.compiledLatLng, gridSize)) {
          return
        }
        point1 = me.latLngToPoint(row.compiledLatLng)
        point2 = me.latLngToPoint({
          lat: row.compiledLatLng.lat + gridSize,
          lng: row.compiledLatLng.lng + gridSize
        })
        me.drawRect(ctx, point1, point2, color, aLegend.opacity)
      })
    })
  }
  onOpDraw(param) {
    const me = this
    const options = me.options
    const data = me.lastClickedData

    const canvas = me._opCanvas
    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height)

    if (!options.visible || !me._opCanvas || !data) {
      return
    }

    // const showLabel = options.showLabel
    const store = me.store
    const gridSize = me.options.gridSize
    const legends = options.legends

    let point
    let fixedLatLng
    let extendPoint
    let aLegend
    let color
    data.forEach(function(row) {
      // fixedLatLng = {
      //   lat: parseInt(row.compiledLatLng.lat / gridSize) * gridSize,
      //   lng: parseInt(row.compiledLatLng.lng / gridSize) * gridSize
      // }
      if (row._filtered === false) {
        return
      }

      fixedLatLng = row.compiledLatLng

      point = me.latLngToPoint(fixedLatLng)
      extendPoint = me.latLngToPoint({
        lat: fixedLatLng.lat + gridSize,
        lng: fixedLatLng.lng + gridSize
      })
      aLegend = legends[store.fetchGroup(row)]

      if (!aLegend.visible) {
        return
      }
      color = me.COLOR_SETTING.transform(aLegend.color)

      context.beginPath()
      context.rect(point.x, point.y, extendPoint.x - point.x, extendPoint.y - point.y)
      // context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${aLegend.opacity})`
      context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`
      context.fill()
      context.lineWidth = 1
      context.strokeStyle = '#003300'
      context.stroke()
      context.closePath()
    })
  }
  drawRect(ctx, point1, point2, color, opacity, withStroke) {
    ctx.beginPath()
    ctx.rect(point1.x, point1.y, point2.x - point1.x, point2.y - point1.y)
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`
    ctx.fill()
    if (withStroke) {
      ctx.stroke()
    }
    ctx.closePath()
  }
  setVisible(visible, legendKey) {
    super.setVisible(visible, legendKey)
    this.repaint()
  }

  setOpacity(opacity, legendKey) {
    super.setOpacity(opacity, legendKey)
    this.repaint()
  }
  lastClickedData = undefined
  _onItemClick(data) {
    const me = this

    me.lastClickedData = data
    me.fire('itemclick', {
      data: data
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
    const me = this
    if (this.options.realResponse && (this.options.offsetX || this.options.offsetY)) {
      const newPoint = {
        x: point.x - this.options.offsetX,
        y: point.y - this.options.offsetY
      }
      latLng = this.mapWrapper.mapCmp.containerPointToLatLng(newPoint)
    }

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

export default GridOverlay
