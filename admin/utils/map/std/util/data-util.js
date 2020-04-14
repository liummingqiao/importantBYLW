/**
 * 数据处理的工具类
 * @class DataUtil
 * @alias DataUtil
 * @memberof std/util/
 */
const DataUtil = (Object.freeze || Object)({
  lastId: 0,
  Coordinate: {
    GCJ02: 'GCJ02',
    WGS84: 'WGS84',
    'EPSG:3857': 'WGS84',
    BD09: 'BD09'
  },
  PI: 3.14159265358979324,
  x_pi: 3.14159265358979324 * 3000.0 / 180.0,
  delta: function(lat, lon) {
    // Krasovsky 1940
    //
    // a = 6378245.0, 1/f = 298.3
    // b = a * (1 - f)
    // ee = (a^2 - b^2) / a^2;
    const a = 6378245.0 //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
    const ee = 0.00669342162296594323 //  ee: 椭球的偏心率。
    let dLat = this.transformLat(lon - 105.0, lat - 35.0)
    let dLon = this.transformLon(lon - 105.0, lat - 35.0)
    const radLat = lat / 180.0 * this.PI
    let magic = Math.sin(radLat)
    magic = 1 - ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI)
    dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI)
    return { 'lat': dLat, 'lng': dLon }
  },
  transformLat: function(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0 * this.PI)) * 2.0 / 3.0
    ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y * this.PI / 30.0)) * 2.0 / 3.0
    return ret
  },
  transformLon: function(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0 * this.PI)) * 2.0 / 3.0
    ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x / 30.0 * this.PI)) * 2.0 / 3.0
    return ret
  },
  /**
   * 根据坐标系转换经纬度
   * @static
   * @memberof DataUtil
   * @param {float} lat 需要转换的纬度
   * @param {float} lng 需要转换的经度
   * @param {string} from 源坐标系
   * @param {string} to 目标坐标系
   * @returns {LatLng} 转换后的经纬度
   */
  transform: function(lat, lng, from, to) {
    const tFrom = this.Coordinate[from]
    const tTo = this.Coordinate[to]

    if (tFrom === tTo) {
      return {
        lat: lat,
        lng: lng
      }
    }

    switch (`${tFrom}->${tTo}`) {
      case `${this.Coordinate.BD09}->${this.Coordinate.GCJ02}`:
        return this.bd2Gcj(lat, lng)
      case `${this.Coordinate.GCJ02}->${this.Coordinate.BD09}`:
        return this.gcj2Bd(lat, lng)
      case `${this.Coordinate.BD09}->${this.Coordinate.WGS84}`:
        return this.bd2Wgs(lat, lng)
      case `${this.Coordinate.WGS84}->${this.Coordinate.BD09}`:
        return this.wgs2Bd(lat, lng)
      case `${this.Coordinate.GCJ02}->${this.Coordinate.WGS84}`:
        return this.gcj2Wgs(lat, lng)
      case `${this.Coordinate.WGS84}->${this.Coordinate.GCJ02}`:
        return this.wgs2Gcj(lat, lng)
      default:
        throw new Error('can not transform '.concat(from).concat(' to').concat(to))
    }
  },
  // WGS-84 to GCJ-02
  wgs2Gcj: function(wgsLat, wgsLon) {
    const d = this.delta(wgsLat, wgsLon)
    return { 'lat': wgsLat + d.lat, 'lng': wgsLon + d.lng }
  },
  // GCJ-02 to WGS-84
  gcj2Wgs: function(gcjLat, gcjLon) {
    const d = this.delta(gcjLat, gcjLon)
    return { 'lat': gcjLat - d.lat, 'lng': gcjLon - d.lng }
  },
  // GCJ-02 to BD-09
  gcj2Bd: function(gcjLat, gcjLon) {
    const x = gcjLon; const y = gcjLat
    const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi)
    const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi)
    const bdLon = z * Math.cos(theta) + 0.0065
    const bdLat = z * Math.sin(theta) + 0.006
    return { 'lat': bdLat, 'lng': bdLon }
  },
  // BD-09 to GCJ-02
  bd2Gcj: function(bdLat, bdLon) {
    const x = bdLon - 0.0065; const y = bdLat - 0.006
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi)
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi)
    const gcjLon = z * Math.cos(theta)
    const gcjLat = z * Math.sin(theta)
    return { 'lat': gcjLat, 'lng': gcjLon }
  },
  // BD-09 to WGS-84
  bd2Wgs: function(bdLat, bdLon) {
    const ll = this.bd2Gcj(bdLat, bdLon)
    return this.gcj2Wgs(ll.lat, ll.lng)
  },
  // WGS-84 to BD-09
  wgs2Bd: function(wgsLat, wgsLng) {
    const ll = this.wgs2Gcj(wgsLat, wgsLng)
    return this.gcj2Bd(ll.lat, ll.lng)
  },
  /**
   * 深度复制
   * @static
   * @memberof DataUtil
   * @param {object} target 目标对象
   * @param {...object} objs 需要被复制的对象
   * @returns {object} 目标对象本身
   */
  deepClone: function(target, ...objs) {
    const me = this
    objs.forEach(function(obj) {
      if (obj) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (Array.isArray(obj[key])) {
              target[key] = me.deepClone(target[key] || [], obj[key])
            } else if (typeof obj[key] === 'object') {
              target[key] = me.deepClone(target[key] || {}, obj[key])
            } else {
              target[key] = obj[key]
            }
          }
        }
      }
    })
    return target
  },
  /**
   * 扩展bounds
   * @static
   * @memberof DataUtil
   * @param {Bounds} bounds 源 bounds, 此bounds将被修改
   * @param  {...Bounds} exBounds 扩展的bounds
   */
  extendBounds(bounds, ...exBounds) {
    exBounds.forEach(function(ex) {
      bounds.north = Math.max(ex.north, bounds.north)
      bounds.south = Math.min(ex.south, bounds.south)
      bounds.east = Math.max(ex.east, bounds.east)
      bounds.west = Math.min(ex.west, bounds.west)
    })
  },
  /**
   * 道格拉斯.普客 数据压缩算法 [Douglas-Peucker algorithm]{@link http://en.wikipedia.org/wiki/Douglas-Peucker_algorithm}
   * @static
   * @memberof DataUtil
   * @param points 格式 [[20, 10], [ 30, 20]] , 通配: [[x, y], [x, y]]
   * @param [tolerance]
   * @returns 压缩后的点数组
   */
  simplify(points, tolerance) {
    if (!tolerance || !points.length) {
      return points.slice()
    }

    var sqTolerance = tolerance * tolerance

    // stage 1: vertex reduction
    points = this._reducePoints(points, sqTolerance)

    // stage 2: Douglas-Peucker simplification
    points = this._simplifyDP(points, sqTolerance)

    return points
  },
  _reducePoints(points, sqTolerance) {
    var reducedPoints = [points[0]]

    for (var i = 1, prev = 0, len = points.length; i < len; i++) {
      if (this._sqDist(points[i], points[prev]) > sqTolerance) {
        reducedPoints.push(points[i])
        prev = i
      }
    }
    if (prev < len - 1) {
      reducedPoints.push(points[len - 1])
    }
    return reducedPoints
  },
  _simplifyDP(points, sqTolerance) {
    var len = points.length
    var ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array
    var markers = new ArrayConstructor(len)

    markers[0] = markers[len - 1] = 1

    this._simplifyDPStep(points, markers, sqTolerance, 0, len - 1)

    var i
    var newPoints = []

    for (i = 0; i < len; i++) {
      if (markers[i]) {
        newPoints.push(points[i])
      }
    }

    return newPoints
  },

  _simplifyDPStep(points, markers, sqTolerance, first, last) {
    var maxSqDist = 0
    var index; var i; var sqDist

    for (i = first + 1; i <= last - 1; i++) {
      sqDist = this._sqClosestPointOnSegment(points[i], points[first], points[last], true)

      if (sqDist > maxSqDist) {
        index = i
        maxSqDist = sqDist
      }
    }

    if (maxSqDist > sqTolerance) {
      markers[index] = 1

      this._simplifyDPStep(points, markers, sqTolerance, first, index)
      this._simplifyDPStep(points, markers, sqTolerance, index, last)
    }
  },
  _sqClosestPointOnSegment(p, p1, p2, sqDist) {
    var x = p1[0]
    var y = p1[1]
    var dx = p2[0] - x
    var dy = p2[1] - y
    var dot = dx * dx + dy * dy
    var t

    if (dot > 0) {
      t = ((p[0] - x) * dx + (p[1] - y) * dy) / dot

      if (t > 1) {
        x = p2[0]
        y = p2[1]
      } else if (t > 0) {
        x += dx * t
        y += dy * t
      }
    }

    dx = p[0] - x
    dy = p[1] - y

    return sqDist ? dx * dx + dy * dy : [x, y]
  },
  _sqDist(p1, p2) {
    var dx = p2[0] - p1[0]
    var dy = p2[1] - p1[1]
    return dx * dx + dy * dy
  }
})

export default DataUtil
