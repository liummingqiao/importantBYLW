
class Group {
  key = undefined
  data = []
  realCount = -1
  /**
   * 创建store下的分组管理, 内部类
   * @constructs Group
   * @memberof std/store/
   * @param {any} groupKey
   */
  constructor(key) {
    this.key = key
  }
  push(row) {
    this.data.push(row)
    return this
  }
  getData() {
    return this.data
  }
  getCount() {
    if (this.realCount === -1) {
      return this.data.length
    }
    return this.realCount
  }
}

export default Group
