import Evented from '../util/evented'
import mixin from '../util/mixin'
import SYSTEM_CONFIG from '../util/system-config'
import DataUtil from '../util/data-util'
import Group from './group'
import { Matrixing } from './matrixing'

const DEFAULT_OPTIONS = {
  latKey: undefined,
  lngKey: undefined,
  groupKey: undefined,
  latIdx: 1,
  lngIdx: 0,
  groupIdx: 2
  // 一般一个系统中只会来源一种经纬度编码的数据，通常在 SystemConfig中统一设置即可，此处是为了支持特定数据来源，可独立设置
  // ,crsCode: 'BD09'
}

class BaseStore extends mixin(Evented, Matrixing) {
  /**
   * 数据更新时触发，例如crschange
   * @event BaseStore#refresh
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 元素本身
   */
  /**
   * 数据filter时触发
   * @event BaseStore#filter
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 元素本身
   */
  /**
   * 删除数据filter时触发
   * @event BaseStore#filtercancel
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 元素本身
   */
  events = ['refresh', 'filter', 'filtercancel']

  filter = undefined
  filteredBounds = undefined

  crsCode = SYSTEM_CONFIG.CRS_CODE
  compiledCrsCode = undefined
  _matrix = {}
  matrixInterval = 10000
  gpsApproximation = 100000
  bounds = {
    north: -90,
    south: 90,
    west: 180,
    east: -180
  }
  center = {
    lat: 0, lng: 0
  }
  /**
   * 根据二维数组创建Store
   * @constructs BaseStore
   * @memberof std/store/
   * @extends Evented
   * @mixes Matrixing
   * @param {any[][]} data <pre>
   * [
   *   ['lat', 'lng', 'group', 'value'], // 第一行表示列头
   *   [25.11233, 115.223885, '好', -82], // 第二行开始表示数据， 经纬度列必须是float类型， group用于数据legend分组呈现
   *   [26.2233, 113.2222331, '差', -82]
   * ]
   * </pre>
   * @param {object} [cfg] 识别 data 内容的配置
   * @param {CRSCode} [cfg.crsCode] 坐标系, default: 系统默认坐标系
   * @param {string} [cfg.latKey] 根据key识别 title中的 维度 idx
   * @param {string} [cfg.lngKey] 根据key识别 title中的 经度 idx
   * @param {string} [cfg.groupKey] 根据key识别 title中的 分组 idx
   * @param {integer} [cfg.latIdx=1] 如果配置了latKey, 尝试利用 latKey来更新 latIdx
   * @param {integer} [cfg.lngIdx=0] 如果配置了lngKey, 尝试利用 lngKey来更新 lngIdx
   * @param {integer} [cfg.groupIdx=2] 如果配置了groupKey, 尝试利用 groupKey来更新 groupIdx
   */
  constructor(data, cfg) {
    super()
    this.options = Object.assign({}, DEFAULT_OPTIONS, cfg)
    const me = this

    me.header = []
    me.headerIdx = {}
    me.rows = []
    me.raw = []
    me.sliced = 1
    me.groups = {}

    me._initialData(data, cfg)
  }
  _initialData(data, cfg) {
    const me = this
    me.raw = data
    me.header = data[0]
    for (const i in me.header) {
      me.headerIdx[me.header[i]] = i
      if (me.header[i] === me.options.latKey) {
        me.options.latIdx = i
      }

      if (me.header[i] === me.options.lngKey) {
        me.options.lngIdx = i
      }

      if (me.header[i] === me.options.groupKey) {
        me.options.groupIdx = i
      }
    }
    me.rows = data.slice(me.sliced)
    if (cfg && cfg.crsCode) {
      me.crsCode = cfg.crsCode
    }
    me.initialMatrix()
    me.buildMatrix(me.rows)

    let groupKey
    me.rows.forEach(function(row) {
      groupKey = me.fetchGroup(row)
      if (me.groups[groupKey]) {
        me.groups[groupKey].push(row)
      } else {
        me.groups[groupKey] = new Group(groupKey).push(row)
      }
    })
  }
  /**
   * 根据Header内容 将数据列 转换成 Object形式
   * @param {any[]} row 传入的本store的数据
   * @returns {object}
   */
  toObject(row) {
    const obj = {}
    this.header.forEach(function(title, idx) {
      obj[title] = row[idx]
    })

    return obj
  }
  /**
   * 获取store的 header
   * @returns {string[]} headers
   */
  getHeader() {
    return this.header
  }
  /**
   * 获取store的所有数据
   * @returns {any[][]} 例： [[25.11233, 115.223885, '好', -82], [26.2233, 113.2222331, '差', -82]]
   */
  getRows() {
    return this.rows
  }
  /**
   * 获取数据的数量
   * @returns {integer}
   */
  getSize() {
    return this.rows.length
  }
  onBeforeBind(layer) {
    this._transformLatLng(this.crsCode, layer.mapWrapper.mapCmp.options.crs.code)
  }
  onBind(layer) {
    if (layer) {
      layer.mapWrapper.mapCmp.on('crschange', this._onCrsChanged, this)
    }
  }
  onUnbind(layer) {
    layer.mapWrapper.mapCmp.off('crschange', this._onCrsChanged)
  }
  _onCrsChanged(e) {
    this._transformLatLng(this.crsCode, e.newCrs.code)
    this.fire('refresh')
  }
  // 根据CRS转换LATLNG数据
  _transformLatLng(fromCode, toCode) {
    const me = this
    this.rows.forEach(function(row) {
      row.compiledLatLng = DataUtil.transform(me.fetchLat(row), me.fetchLng(row), fromCode, toCode)
    })
    if (this.bounds) {
      const sw = DataUtil.transform(this.bounds.south, this.bounds.west, fromCode, toCode)
      const ne = DataUtil.transform(this.bounds.north, this.bounds.east, fromCode, toCode)

      this.bounds = {
        north: ne.lat,
        east: ne.lng,
        south: sw.lat,
        west: sw.lng
      }
    }

    if (this.center) {
      this.center = DataUtil.transform(this.center.lat, this.center.lng, fromCode, toCode)
    }

    if (this.cendroid) {
      this.cendroid = DataUtil.transform(this.cendroid.lat, this.cendroid.lng, fromCode, toCode)
    }
    this.compiledCrsCode = toCode
  }
  /**
   * 提取数据的 lat 值
   * @returns {float}
   */
  fetchLat(rowData) {
    return rowData[this.options.latIdx]
  }
  /**
   * 提取数据的 lng 值
   * @param {any[]} rowData 被提取的数据
   * @returns {float}
   */
  fetchLng(rowData) {
    return rowData[this.options.lngIdx]
  }
  /**
   * 提取数据的 group 值
   * @param {any[]} rowData 被提取的数据
   * @returns {any}
   */
  fetchGroup(rowData) {
    return rowData[this.options.groupIdx]
  }
  /**
   * 提取数据的 某个数据
   * @param {any[]} rowData 被提取的数据
   * @param {string} title 需要提取的数据title
   * @returns {any}
   */
  fetch(rowData, key) {
    return rowData[this.headerIdx[key]]
  }
  /**
   * 获取分组数据
   * @param {any} groupKey 需要提取的 group 的值
   * @returns {std/store/Group} [std/store/Group]{@link Group}
   */
  getGroup(groupKey) {
    return this.groups[groupKey]
  }
  /**
   * 获取所有分组数据
   * @returns {object} {groupKey1: group1, groupKey2: group2}
   */
  getGroups() {
    return this.groups
  }

  /**
   * 获取filtered之后的 Bounds
   * @returns {Bounds|undefined} 当无filter或者 filter全部未命中时，返回 undefined
   */
  getFilteredBounds() {
    return this.filteredBounds
  }
  /**
   * 设置 filter，设置后即时触发 filter行为
   * @param {Function} fn 每行数据都进行一次filter校验<br/>
   * Function参数： store: store本身， row: 遍历的行数据 <br />
   * 返回值: <strong>true</strong>-数据验证通过, <strong>false</strong>-数据验证不通过
   * @example
   store.setFilter(function(store, row) {
    return store.fetch(row, 'RSRP') > -75
   })
   */
  setFilter(fn) {
    if (fn) {
      const me = this
      me.filter = fn

      const bounds = {
        north: -90,
        south: 90,
        west: 180,
        east: -180
      }

      Object.values(me.getGroups()).forEach(function(group) {
        group.realCount = 0
      })
      let lat, lng
      let hasValidData = false
      me.rows.forEach(function(row) {
        row._filtered = me.filter(me, row)
        if (row._filtered) {
          hasValidData = true
          lat = me.fetchLat(row)
          lng = me.fetchLng(row)

          me.getGroup(row[me.options.groupIdx]).realCount += 1

          bounds.north = Math.max(lat, bounds.north)
          bounds.south = Math.min(lat, bounds.south)
          bounds.east = Math.max(lng, bounds.east)
          bounds.west = Math.min(lng, bounds.west)
        }
      })
      if (hasValidData) {
        me.filteredBounds = bounds
      }
      me.fire('filter')
    }
  }
  /**
   * 清除 filter
   * @example
   store.clearFilter()
   */
  clearFilter() {
    const me = this
    me.filter = undefined
    Object.values(me.getGroups()).forEach(function(group) {
      group.realCount = -1
    })
    me.rows.forEach(function(row) {
      row._filtered = true
    })
    this.filteredBounds = undefined
    me.fire('filtercancel')
  }

  _setMatrixInterval(matrixInterval) {
    this.matrixInterval = matrixInterval
  }
  _getMatrixInterval() {
    return this.matrixInterval
  }
}

export default BaseStore
