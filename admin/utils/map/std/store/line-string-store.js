import BaseStore from './base-store'
import Group from './group'
import * as turf from '@turf/turf'

const DEFAULT_OPTIONS = {
  geojsonKey: 'linestring',
  geojsonIdx: 5
}

class LineStringStore extends BaseStore {
  // 数据更新时触发，例如crschange
  events = ['refresh']
  matrixInterval = 1000
  /**
   * 根据二位数组创建Store<br/>
   * <strong>此store中，latKey, lngKey将失效，数据由GeoJSON中读取</strong>
   * @constructs LineStringStore
   * @memberof std/store/
   * @extends BaseStore
   * @param {any[][]} data 参考 {@link BaseStore}
   * @param {object} [cfg] 识别 data 内容的配置
   * @param {string} [cfg.geojsonKey=linestring] 此列对应的数据为 {@link GeoJSON} 对象
   * @param {string} [cfg.groupKey] 根据key识别 title中的 分组 idx
   */
  constructor(data, cfg) {
    super(data, Object.assign({}, DEFAULT_OPTIONS, cfg))
    this._setMatrixInterval(1000)
  }

  _initialData(data, cfg) {
    this.fixedLatIdx = 1
    this.fixedLngIdx = 0
    this.fixedGroupIdx = 2
    this.fixedRawIdx = 3

    const me = this
    me.raw = data
    me.header = data[0]
    for (const i in me.header) {
      me.headerIdx[me.header[i]] = i
      if (me.header[i] === me.options.geojsonKey) {
        me.options.geojsonIdx = i
      }

      if (me.header[i] === me.options.groupKey) {
        me.options.groupIdx = i
      }
    }
    const rawRows = data.slice(me.sliced)
    let geo, coords, i, group
    me.rows = []
    const realCountMapping = {}
    rawRows.forEach(function(row, idx) {
      geo = row[me.options.geojsonIdx]
      coords = geo.coordinates
      group = row[me.options.groupIdx]
      for (i = 0; i < coords.length - 1; i++) {
        me.rows.push([coords[i][0], coords[i][1], group, idx])
        me.rows.push([coords[i + 1][0], coords[i + 1][1], group, idx])
      }
      realCountMapping[group] ? realCountMapping[group]++ : realCountMapping[group] = 1
      row._turfData = turf.lineString(coords)
    })
    me.rawRows = rawRows
    if (cfg && cfg.crsCode) {
      me.crsCode = cfg.crsCode
    }
    me.matrixInterval = 1000
    me.initialMatrix()
    me.buildMatrix(me.rows)
    let groupKey
    me.rows.forEach(function(row) {
      groupKey = me.fetchGroup(row)
      if (me.groups[groupKey]) {
        me.groups[groupKey].push(row)
      } else {
        me.groups[groupKey] = new Group(groupKey).push(row)
        me.groups[groupKey].realCount = realCountMapping[groupKey]
      }
    })
  }
  /**
   * 提取数据的 lat 值
   * @returns {float}
   */
  fetchLat(rowData) {
    return rowData[this.fixedLatIdx]
  }

  fetchLng(rowData) {
    return rowData[this.fixedLngIdx]
  }
  /**
   * 提取数据的 lng 值
   * @param {any[]} rowData 被提取的数据
   * @returns {float}
   */
  fetchRaw(rowData) {
    return this.rawRows[rowData[this.fixedRawIdx]]
  }
  /**
   * 提取数据的 group 值
   * @param {any[]} rowData 被提取的数据
   * @returns {any}
   */
  fetchGroup(rowData) {
    return rowData[this.fixedGroupIdx]
  }
  fetchRawGroup(rawRow) {
    return rawRow[this.options.groupIdx]
  }

  getFilteredBounds() {
    return this.filteredBounds
  }
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
      let bbox
      let hasValidData = false
      me.rawRows.forEach(function(row) {
        row._filtered = me.filter(me, row)
        if (row._filtered) {
          hasValidData = true

          me.getGroup(row[me.options.groupIdx]).realCount += 1
          bbox = turf.bbox(row._turfData)

          // BBOX bbox extent in minX, minY, maxX, maxY order
          bounds.north = Math.max(bbox[3], bounds.north)
          bounds.south = Math.min(bbox[1], bounds.south)
          bounds.east = Math.max(bbox[2], bounds.east)
          bounds.west = Math.min(bbox[0], bounds.west)
        }
      })
      if (hasValidData) {
        me.filteredBounds = bounds
      }
      me.fire('filter')
    }
  }

  clearFilter() {
    const me = this
    me.filter = undefined
    Object.values(me.getGroups()).forEach(function(group) {
      group.realCount = 0
    })
    me.rawRows.forEach(function(row) {
      row._filtered = true
      me.getGroup(row[me.options.groupIdx]).realCount += 1
    })
    this.filteredBounds = undefined
    me.fire('filtercancel')
  }
}

export default LineStringStore
