import DataUtil from '../util/data-util'
import MapComponent from '../map-component'
import SYSTEM_CONFIG from '../util/system-config'

const DEFAULT_OPTIONS = {
  crsCode: SYSTEM_CONFIG.CRS_CODE
}

class Marker extends MapComponent {
  /**
   * 标准Marker
   * @constructs Marker
   * @extends MapComponent
   * @memberof std/layers/
   * @param latLng 经纬度
   * @param [opts]
   * @param [opts.crsCode] 系统默认坐标系
   */
  constructor(latLng, opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
    this.latLng = latLng
  }

  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    const latLng = this.latLng
    this._compiledLatLng = DataUtil.transform(latLng.lat, latLng.lng, this.options.crsCode, mapWrapper.getCrsCode())
    mapWrapper.on('crschange', this._crsChange, this)
    return this
  }

  _crsChange(e) {
    const me = this
    const latLng = me.latLng
    me._compiledLatLng = DataUtil.transform(latLng.lat, latLng.lng, me.options.crsCode, this.mapWrapper.getCrsCode())
    this._updatePosition()
  }

  /**
   * 更新Marker位置
   * @param {LatLng}
   */
  update(latLng) {
    this.latLng = latLng
    this._compiledLatLng = DataUtil.transform(latLng.lat, latLng.lng, this.options.crsCode, this.mapWrapper.getCrsCode())
    this._updatePosition()
  }

  _getCompiledLatLng() {
    return this._compiledLatLng
  }
  _updatePosition() {
    // 底层实现位置重置
  }
}

export default Marker
