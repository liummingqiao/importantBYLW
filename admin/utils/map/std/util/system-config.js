/**
 * 系统配置类
 * @class
 * @constructs SystemConfig
 * @memberof std/util/
 */
class SystemConfig {
  static CRS_CODE_BD09 = 'BD09'
  static CRS_CODE_GCJ02 = 'GCJ02'
  static CRS_CODE_WGS84 = 'WGS84'

  /**
   * @static
   * @property {string} CRS_CODE=WGS84 系统默认使用的坐标系
   */
  static CRS_CODE = 'WGS84' // 一般为 'WGS84','GCJ02', 'BD09'
}

export default SystemConfig
