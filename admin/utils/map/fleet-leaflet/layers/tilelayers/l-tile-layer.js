import * as L from 'leaflet'

import TileLayer from '../../../std/layers/tilelayer/tile-layer'

var UxBaseTileLayer = L.TileLayer.extend({
  initialize: function(url, options) {
    L.TileLayer.prototype.initialize.call(this, url, L.extend({}, {
      crs: L.CRS.EPSG3857
    }, options))
  },
  onAdd: function(map) {
    const eventObj = {
      oldCrs: this._map.options.crs,
      newCrs: this.options.crs
    }
    this._map.options.crs = this.options.crs
    L.TileLayer.prototype.onAdd.call(this, map)
    if (eventObj.oldCrs !== eventObj.newCrs) {
      this._map.fire('crschange', eventObj, this)
    }
  },
  onRemove(map) {
    L.TileLayer.prototype.onRemove.call(this, map)
  }
})

var UxBaseTencentTileLayer = UxBaseTileLayer.extend({
  getTileUrl: function(coords) {
    const y = Math.pow(2, coords.z) - 1 - coords.y
    const y16 = Math.floor(y / 16.0)
    const data = {
      r: '',
      s: this._getSubdomain(coords),
      x: coords.x,
      y: y,
      x16: Math.floor(coords.x / 16.0),
      y16: y16,
      z: this._getZoomForUrl()
    }

    return L.Util.template(this._url, L.Util.extend(data, this.options))
  }

})

L.CRS.GCJ02 = L.extend({}, L.CRS.EPSG3857, {
  code: 'GCJ02'
})

export default class LTileLayer extends TileLayer {
  constructor(opts) {
    super(opts)
    this.TILE_CONFIG = {
      'gaode': {
        'normal': new UxBaseTileLayer('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
          crs: L.CRS.GCJ02,
          maxZoom: 18,
          minZoom: 3,
          subdomains: ['1', '2', '3', '4']
        }),
        'sat': L.layerGroup([
          new UxBaseTileLayer('http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
            crs: L.CRS.GCJ02,
            maxZoom: 18,
            minZoom: 3,
            subdomains: ['1', '2', '3', '4']
          }),
          new UxBaseTileLayer('http://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
            crs: L.CRS.GCJ02,
            maxZoom: 18,
            minZoom: 3,
            subdomains: ['1', '2', '3', '4']
          })
        ], {
          crs: L.CRS.GCJ02
        })
      },
      'OSM': {
        'normal': new UxBaseTileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      },
      'tencent': {
        'normal': new UxBaseTencentTileLayer('http://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=vector&style=0', {
          crs: L.CRS.GCJ02,
          maxZoom: 18,
          subdomains: ['0', '1', '2', '3']
        }),
        'sat': new UxBaseTencentTileLayer('http://p{s}.map.gtimg.com/sateTiles/{z}/{x16}/{y16}/{x}_{y}.jpg', {
          crs: L.CRS.GCJ02,
          maxZoom: 18,
          subdomains: ['0', '1', '2', '3']
        })
      },
      'google': {
        'normal': new UxBaseTileLayer('http://mt{s}.google.com/vt/lyrs=m&hl=en&gl=en&src=app&x={x}&y={y}&z={z}&s=Ga', {
          maxZoom: 18,
          subdomains: ['0', '1', '2', '3']
        }),
        'sat': new UxBaseTileLayer('http://mt{s}.google.com/vt/lyrs=y&hl=en&gl=en&src=app&x={x}&y={y}&z={z}&s=Ga', {
          maxZoom: 18,
          subdomains: ['0', '1', '2', '3']
        }),
        'street': L.layerGroup([
          new UxBaseTileLayer('http://mt{s}.google.com/vt/lyrs=m&hl=en&gl=en&src=app&x={x}&y={y}&z={z}&s=Ga', {
            maxZoom: 18,
            subdomains: ['0', '1', '2', '3']
          }),
          new UxBaseTileLayer('https://mts{s}.google.com/mapslt?lyrs=svv&scale=2&gl=en&x={x}&y={y}&z={z}&hl=en&style=40,18&w=256&h=256', {
            maxZoom: 18,
            subdomains: ['0', '1', '2', '3']
          })
        ]),
        'streetonly': new UxBaseTileLayer('https://mts{s}.google.com/mapslt?lyrs=svv&scale=2&gl=en&x={x}&y={y}&z={z}&hl=en&style=40,18&w=256&h=256', {
          maxZoom: 18,
          subdomains: ['0', '1', '2', '3']
        })
      }
    }

    const BMap = window.BMap

    if (BMap) {
      var BaiduSphericalMercator = {
        /**
         * Project latLng to point coordinate
         *
         * @method project
         * @param {Object} latLng coordinate for a point on earth
         * @return {Object} leafletPoint point coordinate of L.Point
         * @ignore
         */
        project: function(latLng) {
          if (!latLng) {
            return latLng
          }

          var projection = new BMap.MercatorProjection()
          var point = projection.lngLatToPoint(
            new BMap.Point(latLng.lng, latLng.lat)
          )
          var leafletPoint = new L.Point(point.x, point.y)
          return leafletPoint
        },

        /**
         * unproject point coordinate to latLng
         *
         * @method unproject
         * @param {Object} bpoint baidu point coordinate
         * @return {Object} latitude and longitude
         * @ignore
         */
        unproject: function(bpoint) {
          var projection = new BMap.MercatorProjection()
          var point = projection.pointToLngLat(
            new BMap.Pixel(bpoint.x, bpoint.y)
          )
          var latLng = new L.LatLng(point.lat, point.lng)
          return latLng
        },

        /**
         * Don't know how it used currently.
         *
         * However, I guess this is the range of coordinate.
         * Range of pixel coordinate is gotten from
         * BMap.MercatorProjection.lngLatToPoint(180, -90) and (180, 90)
         * After getting max min value of pixel coordinate, use
         * pointToLngLat() get the max lat and Lng.
         */
        bounds: (function() {
          var MAX_X = 20037726.37
          var MIN_Y = -11708041.66
          var MAX_Y = 12474104.17
          var bounds = L.bounds(
            [-MAX_X, MIN_Y], // -180, -71.988531
            [MAX_X, MAX_Y] // 180, 74.000022
          )
          var MAX = 33554432
          bounds = new L.Bounds(
            [-MAX, -MAX],
            [MAX, MAX]
          )
          return bounds
        })()
      }

      /**
       * Coordinate system for Baidu BD09
       *
       * @class BD09
       * @ignore
       */
      L.CRS.BD09 = L.extend({}, L.CRS.EPSG3857, {
        code: 'BD09',
        projection: BaiduSphericalMercator,

        transformation: (function() {
          var z = -18 - 8
          var scale = Math.pow(2, z)
          return new L.Transformation(scale, 0.5, -scale, 0.5)
        }())
      })

      var UxBaseBaiduTileLayer = UxBaseTileLayer.extend({
        getTileUrl: function(coords) {
          var offset = Math.pow(2, coords.z - 1)
          var x = coords.x - offset
          var y = offset - coords.y - 1
          var baiduCoords = L.point(x, y)
          baiduCoords.z = coords.z
          return L.TileLayer.prototype.getTileUrl.call(this, baiduCoords)
        }
      })

      this.TILE_CONFIG['baidu'] = {
        'normal': new UxBaseBaiduTileLayer('http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl', {
          minZoom: 4,
          crs: L.CRS.BD09,
          attribution: '',
          subdomains: ['0', '1', '2', '3']
        }),
        'sat': L.layerGroup(
          [
            new UxBaseBaiduTileLayer('http://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46&udt=20160506', {
              minZoom: 4,
              crs: L.CRS.BD09,
              attribution: '',
              subdomains: ['0', '1', '2', '3']
            }), new UxBaseBaiduTileLayer('http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl&v=017&udt=20160506', {
              minZoom: 4,
              crs: L.CRS.BD09,
              attribution: '',
              subdomains: ['0', '1', '2', '3']
            })
          ], {
            crs: L.CRS.BD09
          }
        ),
        'street': L.layerGroup(
          [
            new UxBaseBaiduTileLayer('http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=pl', {
              minZoom: 4,
              crs: L.CRS.BD09,
              attribution: '',
              subdomains: ['0', '1', '2', '3']
            }), new UxBaseBaiduTileLayer('http://pcsv{s}.map.bdimg.com/tile/?udt=20150114&qt=tile&styles=pl&x={x}&y={y}&z={z}', {
              minZoom: 4,
              crs: L.CRS.BD09,
              attribution: '',
              subdomains: ['0', '1', '2']
            })
          ], {
            crs: L.CRS.BD09
          }
        ),
        'streetonly': new UxBaseBaiduTileLayer('http://pcsv{s}.map.bdimg.com/tile/?udt=20150114&qt=tile&styles=pl&x={x}&y={y}&z={z}', {
          minZoom: 4,
          crs: L.CRS.BD09,
          attribution: '',
          subdomains: ['0', '1', '2']
        })

      }
    }
  }
  create() {
    const me = this
    const options = me.options
    const TILE_CONFIG = me.TILE_CONFIG

    if (options.tile) {
      var parts = options.tile.split('.')

      var providerName = parts[0]
      var mapType = parts[1]

      if (TILE_CONFIG[providerName] && TILE_CONFIG[providerName][mapType]) {
        this._lcmp = TILE_CONFIG[providerName][mapType]
        this._lcmp.options.tile = options.tile
      } else {
        throw new Error(`${options.tile} is not supported!`)
      }
    }

    return me
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    this._lcmp.addTo(mapWrapper.mapCmp)
    return this
  }
}
