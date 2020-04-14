/**
 * @mixin
 * @alias GridInteract
 * @memberof std/layers/overlay/
 */
const GridInteract = {
  /**
   * 判断是否碰撞栅格
   * @param {LatLng} latLng
   * @returns {boolean}
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
   * 获取碰撞的栅格元素
   * @param {LatLng} latLng
   * @param {boolean} [overAll=false] 是否找到一个元素之后继续查找
   * @returns {any[][]} 获取点中的数据列表
   */
  impact: function(latLng, overAll) {
    const me = this
    const store = me.store
    const gridSize = me.options.gridSize
    const legends = me.options.legends
    const impactItem = []
    // 不可点击，不可见，没有数据的情况下，直接返回
    if (!me.options.clickable || !store) {
      return impactItem
    }

    const bounds = {
      north: latLng.lat,
      south: latLng.lat,
      east: latLng.lng,
      west: latLng.lng
    }

    // matrixing
    const aroundData = store.getAroundData(bounds)

    aroundData.every(function(data) {
      if (data._filtered === false) {
        return true
      }
      if (legends[store.fetchGroup(data)].visible) {
        if (me.inGrid(data.compiledLatLng, latLng, gridSize)) {
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
   * 判断一个点是否在栅格内
   * @param {LatLng} gridBottomLeft 栅格左下角坐标
   * @param {LatLng} latLng 用来判断是否在 grid内的经纬度
   * @param {float} gridSize 栅格的size, 单位：degrees, 一般默认 0.001 约等于100米
   * @returns {boolean}
   */
  inGrid(gridBottomLeft, latLng, gridSize) {
    return gridBottomLeft.lat < latLng.lat &&
    gridBottomLeft.lng < latLng.lng &&
    gridBottomLeft.lat + gridSize > latLng.lat &&
    gridBottomLeft.lng + gridSize > latLng.lng
  }
}

export default GridInteract
