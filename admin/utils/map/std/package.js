/**
 * @namespace std/
 */
export const package_name = 'std/'

/**
 * @typedef LatLng
 * @property {float} lat 纬度
 * @property {float} lng 经度
 */

/**
 * @typedef Bounds
 * @property {float} north bounds的上边界，最北的维度
 * @property {float} south bounds的下边界，最南的维度
 * @property {float} west bounds的左边界，最西的经度
 * @property {float} east bounds的右边界，最东的经度
 */

/**
  * @typedef Pixel
  * @property {integer} x 像素点的 x
  * @property {integer} y 像素点的 y
  */

/**
 * size = 3的整形数组，用来对应表示 RGB的数值, 例如 [211, 33, 42]
  * @typedef RGB
  */

/**
   * 仅支持 4种字面量 topleft|topright|bottomleft|bottomright
   * @typedef Position
   */

/**
 * 此数据表明是ZTree的内部数据对象
 * @typedef ZTreeNode
 */

/**
 * GeoJSON 对象，详情请参考：
 * [GeoJSON Format]{@link https://tools.ietf.org/html/rfc7946}
 * @typedef GeoJSON
 */

/**
 * 字面量 WGS84|GCJ02|BD09
 * @typedef CRSCode
 */
