import * as turf from '@turf/turf'
import DataUtil from '../../util/data-util'

const VALID_DISTANCE = [
  0, 10, 8, 6, 4, 2, // 1 ~ 5  必须点在线上
  0.8, 0.4, 0.2, 0.1, 0.085, // 6 ~ 10 必须点在线上
  0.07, 0.06, 0.05, 0.035, 0.02, // 11 ~ 15
  0.01, 0.006, 0.004, 0.004, 0.004 // 16 ~ 20
]

/**
 * @mixin
 * @alias LineInteract
 * @memberof std/layers/overlay/
 */
const LineInteract = {
  /**
   * 判断是否碰撞栅格
   * @param {LatLng} latLng
   * @returns {boolean}
   */
  isImpact: function(latLng) {
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
    const legends = me.options.legends
    const impactItem = []
    // 不可点击，不可见，没有数据的情况下，直接返回
    if (!me.options.clickable || !store) {
      return impactItem
    }

    const timestamp = Date.now()
    const bounds = {
      north: latLng.lat,
      south: latLng.lat,
      east: latLng.lng,
      west: latLng.lng
    }

    // matrixing
    const aroundData = store.getAroundData(bounds)
    // 使用与 store的原始坐标系一致的latlng来比较
    const srcLatLng = DataUtil.transform(latLng.lat, latLng.lng, me.mapWrapper.getCrsCode(), store.crsCode)
    const turfPoint = turf.point([srcLatLng.lng, srcLatLng.lat])

    const zoom = me.mapWrapper.getZoom()
    const validDistance = VALID_DISTANCE[zoom]
    let rawRow
    const rawSet = new Set()

    aroundData.forEach(function(data) {
      if (legends[store.fetchGroup(data)].visible) {
        rawRow = store.fetchRaw(data)
        rawSet.add(rawRow)
      }
    })
    const iter = rawSet.values()
    rawRow = iter.next().value
    while (rawRow) {
      if (rawRow._filtered !== false) {
        if (me._isValidPointToLine(rawRow, turfPoint, validDistance, timestamp)) {
          impactItem.push(rawRow)
          if (!overAll) {
            break
          }
        }
      }
      rawRow = iter.next().value
    }

    return impactItem
  },
  /*
   * 处理是否点与线的距离是否在合理范围内（判断是否点中这个线）
   * @param rawRow
   * @param turfPoint
   * @param timestamp
   * @returns {boolean}
   */
  _isValidPointToLine(rawRow, turfPoint, validDistance, timestamp) {
    if (rawRow._lastStamp !== timestamp) {
      rawRow._lastStamp = timestamp
      return turf.pointToLineDistance(turfPoint, rawRow._turfData) <= validDistance
    }
    return false
  }
}

export default LineInteract
