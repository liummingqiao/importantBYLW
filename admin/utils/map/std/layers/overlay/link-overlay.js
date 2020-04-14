import CanvasOverlay from './canvas-overlay'

const DEFAULT_OPTIONS = {
  width: 2,
  color: 'red',
  dashed: false,
  dashStyle: [15, 5] // 设置虚线样式
}

class LinkOverlay extends CanvasOverlay {
  /**
   * 连线渲染 overlay
   * @constructs LinkOverlay
   * @extends CanvasOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {integer} [opts.width=2] 连线粗细，单位: pixel
   * @param {string|RGB} [opts.color=red] 连线的颜色
   * @param {boolean} [opts.dashed=false] 是否使用虚线
   * @param {integer[]} [opts.dashStyle=[15, 5]] 虚线样式
   * @example
   * 注意，LinkOverlay的数据必须是双数，第1,2行数据经纬度进行连线，第3,4行数据经纬度进行连线，以此类推
    linkOverlay.setData([
      ['lng', 'lat'],
      [116.8685727, 38.29922299],
      [120.8813471, 31.37815288],
      [120.977916, 31.35614415],
      [121.3075977, 31.05475938],
      [121.409118, 31.143544],
      [121.410466, 31.143238],
      [121.409118, 31.143544],
      [121.408668, 31.141897]
    ], {
      latKey: 'lat',
      lngKey: 'lng'
    })
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  uiHook() {
    // LinkOverlay 不支持点击
    return undefined
  }
  bindStore(store) {
    const me = this
    super.bindStore(store)
    me._onStoreBind(store)
  }
  onDraw() {
    const me = this

    const canvas = me._canvas
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!me.store || me.store.getSize() === 0 || !me.options.visible) {
      return
    }

    const store = me.store
    const options = me.options
    const rows = store.getRows()
    const color = me.COLOR_SETTING.transform(options.color)

    let cell1, cell2, point1, point2

    ctx.beginPath()
    ctx.lineWidth = options.lineWidth
    ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    if (options.dashed) {
      ctx.setLineDash(options.dashStyle)
    }

    for (let i = 0; i < rows.length; i += 2) {
      cell1 = rows[i]
      cell2 = rows[i + 1]
      if (me.isInView(cell1.compiledLatLng) || me.isInView(cell2.compiledLatLng)) {
        point1 = me.latLngToPoint(cell1.compiledLatLng)
        point2 = me.latLngToPoint(cell2.compiledLatLng)

        ctx.moveTo(point1.x, point1.y)
        ctx.lineTo(point2.x, point2.y)
      }
    }
    ctx.stroke()
    ctx.closePath()
  }
}

export default LinkOverlay
