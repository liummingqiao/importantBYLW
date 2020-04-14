
/**
 * 用于将store数据进行矩阵化数据，支持快速检索，命中数据
 *
 * @mixin
 * @alias Matrixing
 * @memberof std/store/
 */
const Matrixing = {
  /**
   * 初始化矩阵，清理已存在数据
   */
  initialMatrix: function() {
    this._latSum = 0
    this._lngSum = 0
    this._latlngCnt = 0
    this.clearMatrix()
  },
  clearMatrix: function() {
    this._matrix = {}
  },
  /**
   * store的数据
   * @param {any[][]} rows
   */
  buildMatrix: function(rows) {
    var me = this
    rows.forEach(function(row) {
      me.matrixing(row)
    })
    me.center = {
      lat: (me.bounds.north + me.bounds.south) / 2,
      lng: (me.bounds.west + me.bounds.east) / 2
    }
    me.cendroid = {
      lat: this._latSum / this._latlngCnt,
      lng: this._lngSum / this._latlngCnt
    }
  },
  /**
   * 将 store的行数据进行 矩阵化
   * @param {any[]} row
   */
  matrixing: function(row) {
    const me = this
    const matrix = me._matrix
    const bounds = me.bounds
    const index = me.toMatrixIndex(me.fetchLat(row), me.fetchLng(row))
    const lat = me.fetchLat(row)
    const lng = me.fetchLng(row)
    let tileData = matrix[index]

    if (tileData) {
      tileData.push(row)
    } else {
      tileData = []
      tileData.push(row)
      matrix[index] = tileData
    }

    bounds.north = Math.max(lat, bounds.north)
    bounds.south = Math.min(lat, bounds.south)
    bounds.east = Math.max(lng, bounds.east)
    bounds.west = Math.min(lng, bounds.west)

    this._latSum += lat
    this._lngSum += lng
    this._latlngCnt++
  },
  toMatrixIndex: function(lat, lng) {
    var tileIndex = this.toTileLatLng(lat, lng)
    return tileIndex.ilat + ',' + tileIndex.ilng
  },
  toTileLatLng: function(lat, lng) {
    var me = this
    var interval = me.matrixInterval
    var appr = me.gpsApproximation
    var alat = Math.round(lat * appr)
    var alng = Math.round(lng * appr)
    var latIndex = (alat - alat % interval) / interval
    var lngIndex = (alng - alng % interval) / interval

    return {
      ilat: latIndex,
      ilng: lngIndex
    }
  },
  /**
   * 获取数据的中心位置
   *
   * @returns {LatLng} {lat: 24.123332, lng: 122.885672}
   */
  getCenter: function() {
    return this.center
  },
  /**
   * 获取数据的重心位置
   *
   * @returns {LatLng} {lat: 24.123332, lng: 122.885672}
   */
  getCendroid: function() {
    return this.cendroid
  },
  /**
   * 获取数据的有效区域
   *
   * @returns {Bounds} { north: 24.123332, south: 22.233117, west: 112.892771, east: 115.227878 }
   */
  getBounds: function() {
    return this.bounds
  },
  /**
   * 获取相交的 bounds
   * @param {Bounds} bounds1  { north: 24.123332, south: 22.233117, west: 112.892771, east: 115.227878 }
   * @param {Bounds} bounds2  { north: 24.123332, south: 22.233117, west: 112.892771, east: 115.227878 }
   * @returns {Bounds} { north: 24.123332, south: 22.233117, west: 112.892771, east: 115.227878 }
   */
  intersectionBounds: function(bounds1, bounds2) {
    if (bounds1.north < bounds2.south ||
        bounds1.south > bounds2.north ||
        bounds1.west > bounds2.east ||
        bounds1.east < bounds2.west) {
      return null
    }
    return {
      north: Math.min(bounds1.north, bounds2.north),
      south: Math.max(bounds1.south, bounds2.south),
      east: Math.min(bounds1.east, bounds2.east),
      west: Math.max(bounds1.west, bounds2.west)
    }
  },
  /**
   * 根据检索区域，命中矩阵中的数据
   * @param {Bounds} bounds { north: 24.123332, south: 22.233117, west: 112.892771, east: 115.227878 }
   */
  getAroundData: function(bounds) {
    const intersection = this.intersectionBounds(this.getBounds(), bounds)
    if (intersection === null) {
      return []
    }
    return this.getAroundMatrixTiles(intersection).reduce(function(accumulator, currentValue) {
      return accumulator.concat(currentValue)
    }, [])
  },
  // 把标准经纬度 bounds 转换为 tileKey级别的 bounds, 直接通过keys的偏移来提取匹配的tiles
  getAroundMatrixTiles: function(bounds) {
    const tileKeyBounds = {
      north: parseInt(bounds.north * this.gpsApproximation / this.matrixInterval),
      south: parseInt(bounds.south * this.gpsApproximation / this.matrixInterval),
      east: parseInt(bounds.east * this.gpsApproximation / this.matrixInterval),
      west: parseInt(bounds.west * this.gpsApproximation / this.matrixInterval)
    }

    const hitTiles = []
    for (let tileLng = tileKeyBounds.west - 2; tileLng < tileKeyBounds.east + 2; tileLng++) {
      for (let tileLat = tileKeyBounds.south - 2; tileLat < tileKeyBounds.north + 2; tileLat++) {
        if (this._matrix[`${tileLat},${tileLng}`]) {
          hitTiles.push(this._matrix[`${tileLat},${tileLng}`])
        }
      }
    }

    return hitTiles
  }
}

export { Matrixing }
