/**
 * @mixin
 * @alias PointInteract
 * @memberof std/layers/overlay/
 */
const PointInteract = {
  /**
   * 判断是否有数据在位置上，通常该方法响应的是鼠标在地图中的事件， latlng与 pixel表示的是通一个位置
   * @param {LatLng} latLng 鼠标所在位置对应地图的经纬度
   * @param {Pixel} point 鼠标所在地图组件的位置
   * @returns {boolean} 是否与数据有碰撞
   */
  isImpact: function(latLng, point) {
    if (this.options.realResponse && (this.options.offsetX || this.options.offsetY)) {
      const newPoint = {
        x: point.x - this.options.offsetX,
        y: point.y - this.options.offsetY
      }
      latLng = this.mapWrapper.mapCmp.containerPointToLatLng(newPoint)
    }

    return this.impact(latLng, false).length > 0
  },
  /**
   * 获取碰撞的元素
   * @param {LatLng} latLng
   * @param {boolean} [overAll=false] 是否找到一个元素之后继续查找
   * @returns {any[][]} 获取点中的数据列表
   */
  impact: function(latLng, overAll) {
    const me = this
    const store = me.store
    const legends = me.options.legends
    const impactItem = []
    // 不可点击，不可见，没有数据的情况下，直接返回
    if (!me.options.clickable || !store) {
      return impactItem
    }

    const drawSize = me.getDrawSize(me.mapWrapper.getZoom()) || 0

    const radius = me.pixelToDegrees(drawSize) / 2
    const bounds = {
      north: latLng.lat + radius,
      south: latLng.lat - radius,
      east: latLng.lng + radius,
      west: latLng.lng - radius
    }

    // matrixing
    const aroundData = store.getAroundData(bounds)

    aroundData.every(function(data) {
      if (data._filtered === false) {
        return true
      }
      if (legends[store.fetchGroup(data)].visible) {
        if (me.getDistance(data.compiledLatLng, latLng) <= radius) {
          impactItem.push(data)
          if (!overAll) {
            return false
          }
        }
      }

      return true
    })

    return impactItem
  },
  /**
   * 获取两个经纬度之间距离
   * @param {LatLng} latLng1
   * @param {LatLng} latLng2
   * @returns {number} 两个经纬度距离，单位：degrees
   */
  getDistance(latLng1, latLng2) {
    return Math.sqrt(Math.pow(latLng1.lat - latLng2.lat, 2) + Math.pow(latLng1.lng - latLng2.lng, 2))
  }
}

export default PointInteract
