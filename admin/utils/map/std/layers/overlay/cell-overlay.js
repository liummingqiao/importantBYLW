import CanvasOverlay from './canvas-overlay'

const RADIUS_SCALE = [
  1, 0.75, 0.5, 0.25, 0.1,
  0.05, 0.025, 0.01, 0.01, 0.01,
  0.01, 0.01, 0.01, 0.01, 0.01,
  0.001, 0.001, 0.001, 0.001, 0.001
]

const SKIPPED = [100, 100, 80, 60, 40, 20, 12, 8, 4, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

const DEFAULT_OPTIONS = {
  clickable: true,
  clickType: 1, // 1: 表示所有符合的数据都会被点中，并返回数据， 2: 仅返回点中数据的第一条， 3: 仅返回点中数据的最后一条
  opacity: 0.7,
  drawLabel: true,
  labelOffset: 0, // 距离扇区的像素
  labelFontSize: 12,
  labelFields: [], // 画坐标时使用的字段
  labelSeparator: ',',
  labelLevelToMax: 1, // 距离MaxZoom的差值为多少时开始画Label。 例如，地图MaxZoom 为19， 当前为18， 19-18 <= labelLevelToMax, 开始画；如果 19-18 > labelLevelToMax 忽略
  directionKey: 'direction',
  radius: 50,
  fill: 'red',
  sectorDegrees: 45,
  circleRadius: 30,
  circleFill: 'indigo',
  opScale: 1.25,
  skippedThreshold: 5000
}

class CellOverlay extends CanvasOverlay {
  drawStamp = 0
  drawStart = 0
  drawStep = 2000

  partialDrawing = false

  lastClickedData = undefined

  lastDrawSkipped = false

  /**
   * 元素被点中后触发
   * @event CellOverlay#itemclick
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {any[][]} data 被点中的数据
   * @property {ref} event.target 元素本身
   */
  /**
   * 新点击时，老的被点中数据在操作层被清理时触发
   * @event CellOverlay#itemcancel
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {any[][]} data 被清理的数据
   * @property {ref} event.target 元素本身
   */
  events = ['itemclick', 'itemcancel']

  /**
   * 扇区渲染 overlay
   * @constructs CellOverlay
   * @extends CanvasOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts
   * @param {boolean} [opts.clickable=true] 是否可点击
   * @param {boolean} [opts.clickType=1] 1: 表示所有符合的数据都会被点中，并返回数据， 2: 仅返回点中数据的第一条， 3: 仅返回点中数据的最后一条
   * @param {float} [opts.opacity=0.7] 默认扇区图层透明度, 有效范围 0~1
   * @param {boolean} [opts.drawLabel=true] 是否画 扇区 label
   * @param {float} [opts.labelOffset=0] label距离扇区的距离，单位： pixel
   * @param {integer} [opts.labelFontSize=12] label字体大小
   * @param {string[]} [opts.labelFields=[]] 输出label的字段，从store中提取
   * @param {string} [opts.labelSeparator=,] 输出label的多个字段的连接符
   * @param {integer} [opts.labelLevelToMax=1] 距离最大级别为多少时画 label, 例如地图最大放大级别为maxZoom， 当地图级别为 zoom 时， 当 maxZoom - zoom <= labelLevelToMax，画label
   * @param {string} [opts.directionKey=direction] <strong style="color: red;">重要</strong> 扇区渲染关键字段，描述扇区方位角的字段
   * @param {integer} [opts.radius=50] 渲染扇区的半径，单位：pixel
   * @param {string|rgb} [opts.fill=red] 扇区填充颜色， 可以是颜色字符串red,#fafa12，也可以是 rgb数组 [211,33,172]
   * @param {integer} [opts.sectorDegrees=45] 扇区开放角度， 单位： degrees
   * @param {integer} [opts.circleRadius=30] 全向站（画圆）半径，单位：pixel
   * @param {string|rgb} [opts.circleFill=30] 全向站（画圆）填充颜色， 可以是颜色字符串red,#fafa12，也可以是 rgb数组 [211,33,172]
   * @param {float} [opts.opScale=1.25] 点中扇区后的缩放呈现
   * @param {integer} [opts.skippedThreshold=5000] 性能平衡配置
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  shouldSkipDraw() {
    if (!this.options.visible || !this.mapWrapper || !this.store) {
      return true
    }

    // 性能瓶颈，12级以上不画
    // if (this.mapWrapper && this.mapWrapper.getZoom() < 9) {
    //   return true
    // }
    return false
  }
  onOpDraw(param) {
    const me = this
    const opts = me.options
    const data = me.lastClickedData

    if (!opts.visible || !me._opCanvas || !data) {
      return
    }

    const mapRect = me.mapWrapper.mapEl.getBoundingClientRect()
    const canvas = me._opCanvas
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, mapRect.width, mapRect.height)

    const scale = RADIUS_SCALE[me.getZoomDistance()]
    const radius = opts.radius * scale * opts.opScale
    const circleRadius = opts.circleRadius * scale * opts.opScale

    const store = me.store
    let cell, pixel, drawedRadius, direction
    ctx.font = `bold ${this.options.labelFontSize * this.options.opScale}px Arial`
    for (let i = 0; i < data.length; i++) {
      cell = data[i]
      if (cell._filtered === false || !me.isInView(cell.compiledLatLng)) {
        continue
      }

      pixel = me.latLngToPoint(cell.compiledLatLng)
      direction = store.fetch(cell, opts.directionKey)
      if (direction === 0) {
        me.drawCircle(ctx, pixel, circleRadius, me.COLOR_SETTING.transform(opts.circleFill), 1, true)
        drawedRadius = circleRadius
      } else {
        me.drawSector(ctx, pixel, radius, direction, opts.sectorDegrees, me.COLOR_SETTING.transform(opts.fill), 1, true)
        drawedRadius = radius
      }

      if (me.shouldDrawLabel()) {
        me.drawLabel(ctx, pixel, drawedRadius, direction, cell)
      }
    }
  }
  onDraw(param) {
    const me = this
    const canvas = me._canvas
    const bounds = param.bounds
    const mapRect = me.mapWrapper.mapEl.getBoundingClientRect()
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, mapRect.width, mapRect.height)

    if (me.shouldSkipDraw()) {
      this.lastDrawSkipped = true
      return
    }

    const store = me.store
    const opts = me.options
    let cell, pixel, drawedRadius, direction

    const scale = RADIUS_SCALE[me.getZoomDistance()]
    const radius = opts.radius * scale
    const circleRadius = opts.circleRadius * scale

    me.drawStamp = Date.now()
    const currentDrawStamp = me.drawStamp
    const arroundData = store.getAroundData(bounds)

    const drawedData = []
    for (let i = 0; i < arroundData.length; i++) {
      if (arroundData[i]._filtered !== false && me.isInView(arroundData[i].compiledLatLng)) {
        drawedData.push(arroundData[i])
      }
    }

    const shouldDrawLabel = me.shouldDrawLabel()
    ctx.font = `${this.options.labelFontSize}px Arial`

    // 数据超过 this.options.skippedThreshold 才做缩放，否则性能在可接受范围内
    const skipped = drawedData.length > this.options.skippedThreshold ? SKIPPED[param.zoom] : 1

    if (drawedData.length < 2000) {
      for (let i = 0; i < drawedData.length; i++) {
        cell = drawedData[i]

        pixel = me.latLngToPoint(cell.compiledLatLng)
        direction = store.fetch(cell, opts.directionKey)
        // ctx, pixel, radius, direction, degrees, color, withStroke
        if (direction === 0) {
          me.drawCircle(ctx, pixel, circleRadius, me.COLOR_SETTING.transform(opts.circleFill), me.options.opacity)
          drawedRadius = circleRadius
        } else {
          me.drawSector(ctx, pixel, radius, direction, opts.sectorDegrees, me.COLOR_SETTING.transform(opts.fill), me.options.opacity)
          drawedRadius = radius
        }

        if (shouldDrawLabel && (!me.lastClickedData || me.lastClickedData.indexOf(cell) < 0)) {
          me.drawLabel(ctx, pixel, drawedRadius, direction, cell)
        }
      }
      me.lastDrawSkipped = false
    } else {
      const partialDraw = () => {
        if (me.drawStamp !== currentDrawStamp) {
          ctx.clearRect(0, 0, mapRect.width, mapRect.height)
          return
        }
        const endIdx = Math.min(drawedData.length, me.drawStart + me.drawStep)

        for (let i = me.drawStart; i < endIdx; i += skipped) {
          cell = drawedData[i]

          pixel = me.latLngToPoint(cell.compiledLatLng)
          direction = store.fetch(cell, opts.directionKey)
          // ctx, pixel, radius, direction, degrees, color, withStroke
          if (direction === 0) {
            me.drawCircle(ctx, pixel, circleRadius, me.COLOR_SETTING.transform(opts.circleFill), 1.0)
            drawedRadius = circleRadius
          } else {
            me.drawSector(ctx, pixel, radius, store.fetch(cell, opts.directionKey), opts.sectorDegrees, me.COLOR_SETTING.transform(opts.fill), 1.0)
            drawedRadius = radius
          }

          if (shouldDrawLabel && (!me.lastClickedData || me.lastClickedData.indexOf(cell) < 0)) {
            me.drawLabel(ctx, pixel, drawedRadius, direction, cell)
          }
        }
        me.drawStart = endIdx
        if (me.drawStamp === currentDrawStamp && me.drawStart < drawedData.length) {
          setTimeout(partialDraw, 0)
        } else {
          me.drawStart = 0
          me.partialDrawing = false
          me.lastDrawSkipped = false
        }
      }

      me.partialDrawing = true
      setTimeout(partialDraw, 0)
    }
  }
  /**
   * 根据row数据获得要画label的字符串
   * @param {any[]} row
   * @returns {string} 扇区label
   */
  getDrawText(cell) {
    const store = this.store
    return this.options.labelFields.map(function(field) {
      return store.fetch(cell, field)
    }).join(this.options.labelSeparator)
  }
  shouldDrawLabel() {
    return this.options.drawLabel &&
      this.mapWrapper.getZoomDistanceToMax() <= this.options.labelLevelToMax &&
      this.options.labelFields &&
      this.options.labelFields.length > 0
  }
  // 以扇区中心点向对应方向扩展画图半径 + options.labelOffset 距离 + 半个字体作为距离定位Label位置
  drawLabel(ctx, pixel, drawedRadius, direction, cell) {
    const me = this
    const options = me.options
    const text = me.getDrawText(cell)
    // 这个范围从右往左计算偏移（把字画在扇区左边）
    const rtl = direction < 340 && direction > 200
    const distance = drawedRadius + options.labelOffset + options.labelFontSize / 2
    pixel.y = pixel.y - (Math.cos(direction * Math.PI / 180) * distance) // canvas画图 y 轴往下递增
    pixel.x = pixel.x + (Math.sin(direction * Math.PI / 180) * distance)
    if (rtl) {
      pixel.x = pixel.x - ctx.measureText(text).width
    }
    ctx.fillText(text, pixel.x, pixel.y)
  }
  drawSector(ctx, pixel, radius, direction, degrees, color, opacity, withStroke) {
    ctx.beginPath()
    ctx.translate(pixel.x, pixel.y)
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, Math.PI * (direction - degrees / 2 - 90) / 180, Math.PI * (direction + degrees / 2 - 90) / 180, false)
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`
    ctx.fill()
    ctx.translate(-pixel.x, -pixel.y)
    ctx.closePath()

    if (withStroke) {
      ctx.stroke()
    }
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

  bindStore(store) {
    const me = this
    super.bindStore(store)
    me._onStoreBind(store)
  }
  /**
   * 判断是否有数据在位置上，通常该方法响应的是鼠标在地图中的事件， latlng与 pixel表示的是通一个位置
   * @param {LatLng} clickedLatLng 鼠标所在位置对应地图的经纬度
   * @param {Pixel} clickedPixel 鼠标所在地图组件的位置
   * @returns {boolean} 是否与数据有碰撞
   */
  isImpact(clickedLatLng, clickedPixel) {
    if (!this.options.visible) {
      return false
    }
    return this.impact(clickedLatLng, clickedPixel, false).length > 0
  }
  /**
   * 判断是否有数据在位置上，通常该方法响应的是鼠标在地图中的事件， latlng与 pixel表示的是通一个位置
   * @param {LatLng} clickedLatLng 鼠标所在位置对应地图的经纬度
   * @param {Pixel} clickedPixel 鼠标所在地图组件的位置
   * @returns {any[]} 返回点中的数据
   */
  impact(latLng, clickedPixel, overAll) {
    const me = this
    const store = me.store
    const opts = me.options
    const impactItem = []
    // 不可点击，不可见，没有数据的情况下，直接返回
    if (!me.options.clickable || !store || !me.options.visible) {
      return impactItem
    }

    const scale = RADIUS_SCALE[me.getZoomDistance()]
    const drawSize = me.options.radius * scale
    const circleSize = me.options.circleRadius * scale

    const radius = me.pixelToDegrees(drawSize)

    const bounds = {
      north: latLng.lat + radius,
      south: latLng.lat - radius,
      east: latLng.lng + radius,
      west: latLng.lng - radius
    }

    // matrixing
    const aroundData = store.getAroundData(bounds)

    // 画图小于两个像素，不需要依赖canvas来判断
    if (drawSize < 2) {
      aroundData.every(function(data) {
        if (data._filtered === false) {
          return true
        }
        if (me.getDistance(data.compiledLatLng, latLng) <= radius) {
          impactItem.push(data)
          if (!overAll) {
            return false
          }
        }

        return true
      })
    } else {
      const ctx = me._opCanvas.getContext('2d')
      let pixel
      aroundData.every(function(data) {
        if (data._filtered === false) {
          return true
        }
        pixel = me.latLngToPoint(data.compiledLatLng)
        if (store.fetch(data, opts.directionKey) === 0) {
          me.drawCircle(ctx, pixel, circleSize, [0, 0, 0], 0)
        } else {
          me.drawSector(ctx, pixel, drawSize, store.fetch(data, opts.directionKey), opts.sectorDegrees, [0, 0, 0], 0)
        }

        if (ctx.isPointInPath(clickedPixel.x, clickedPixel.y)) {
          impactItem.push(data)
          if (!overAll) {
            return false
          }
        }

        return true
      })
    }

    return impactItem
  }

  getDistance(latLng1, latLng2) {
    return Math.sqrt(Math.pow(latLng1.lat - latLng2.lat, 2) + Math.pow(latLng1.lng - latLng2.lng, 2))
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

    if (me.shouldDrawLabel()) {
      me.repaint()
    } else {
      me.opRepaint()
    }
  }

  _onItemCancel() {
    const me = this
    const data = me.lastClickedData
    me.lastClickedData = undefined
    me.fire('itemcancel', {
      data: data
    })

    if (me.shouldDrawLabel()) {
      me.repaint()
      me.clearOpCanvas()
    } else {
      me.clearOpCanvas()
    }
  }

  clearOpCanvas() {
    const me = this
    const canvas = me._opCanvas
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  _onMapClick(latLng, pixel) {
    const me = this
    const clickedData = me.impact(latLng, pixel, true)
    if (clickedData.length > 0) {
      me._onItemClick(clickedData)
    } else {
      if (me.lastClickedData) {
        me._onItemCancel()
      }
    }
  }

  setVisible(visible) {
    super.setVisible(visible)
    if (visible && this.lastDrawSkipped) {
      this.repaint()
    }
  }
}

export default CellOverlay
