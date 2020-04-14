import Panel from './panel'
import { DomUtil, DomEvent } from '../util/dom-util'

const BASE_CLASS = 'fm-locate'
const DEFAULT_OPTIONS = {
  position: 'topleft',
  visible: true,
  prompt: locales.locate.prompt,
  closeButton: false,
  hideOnClose: true,
  dragable: false,
  header: false,
  body: undefined, // HTML
  vertical: '10px',
  bodyStyle: {
    background: 'transparent',
    padding: '0'
  }
}

/**
 * 定位组件的基类
 * @extends Panel
 */
class Locate extends Panel {
  /**
   * @constant
   * @property {string} CONTROL_KEY=locate 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'locate'
  /**
   * 创建定位组件
   * @param {object} opts - 组件初始化配置
   * @param {boolean} [opts.visible=true] 组件是否可见
   * @param {Position} [opts.position=topleft] 组件在地图的位置
   * @param {string} [opts.prompt=locales.locate.prompt]
   * @constructs Locate
   * @memberof std/control/
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))

    const me = this
    me.on('hide', function(e) {
      me._cleanSearchBox()
    }, me)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    this.onAdd(mapWrapper)
  }
  bodyHook() {
    const me = this
    const bodyEl = me.bodyEl = DomUtil.create('div', BASE_CLASS)
    // 输入框
    const inputDiv = DomUtil.create('div', undefined, bodyEl)
    const searchInput = DomUtil.create('input', BASE_CLASS + '-input', inputDiv)
    searchInput.placeholder = me.options.prompt
    DomEvent.on(searchInput, 'keypress', me._onSearchInputKeyPress, me)
    DomEvent.on(searchInput, 'keyup', me._onSearchInputKeyUp, me)
    // 删除按钮
    const deleteBtn = DomUtil.create('button', BASE_CLASS + '-delete-btn', inputDiv)
    deleteBtn.title = locales.locate.clear
    DomEvent.on(deleteBtn, 'click', me._onDeleteBtnClick, me)
    // 查询按钮
    const searchDiv = DomUtil.create('div', BASE_CLASS + '-search', bodyEl)
    const searchBtn = DomUtil.create('button', BASE_CLASS + '-search-btn', searchDiv)
    searchBtn.title = locales.locate.search
    DomEvent.on(searchBtn, 'click', me._onSearchBtnClick, me)
    return bodyEl
  }
  _onSearchBtnClick(e) {
    const searchInput = this._getInputEl()
    if (searchInput) {
      this.search(searchInput.value.trim())
    }
  }
  _onDeleteBtnClick(e) {
    this.clear()
    const deleteBtn = this._getDeleteButtonEl()
    deleteBtn.style.display = 'none'
  }
  _onSearchInputKeyPress(e) {
    const inputEl = this._getInputEl()
    const searchText = inputEl.value.trim()
    if (searchText && e.keyCode === 13) {
      const searchButton = this._getSearchButtonEl()
      searchButton.click()
    }
  }
  _onSearchInputKeyUp(e) {
    const inputEl = this._getInputEl()
    const searchText = inputEl.value.trim()
    const deleteBtn = this._getDeleteButtonEl()
    if (searchText) {
      deleteBtn.style.display = 'block'
    } else {
      deleteBtn.style.display = 'none'
    }
  }
  _getInputEl() {
    const bodyEl = this.bodyEl
    return bodyEl.getElementsByClassName(BASE_CLASS + '-input')[0]
  }
  _getSearchButtonEl() {
    const bodyEl = this.bodyEl
    return bodyEl.getElementsByClassName(BASE_CLASS + '-search-btn')[0]
  }
  _getDeleteButtonEl() {
    const bodyEl = this.bodyEl
    return bodyEl.getElementsByClassName(BASE_CLASS + '-delete-btn')[0]
  }
  _isCoordinate(searchText) {
    if (!searchText) return
    const latLngReg = /^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?),\s*[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/
    const matched = searchText.match(latLngReg)
    if (matched) {
      const latLngStrArr = searchText.split(',')
      return { lat: parseFloat(latLngStrArr[1].trim()), lng: parseFloat(latLngStrArr[0].trim()) }
    }
  }
  _cleanSearchBox() {
    const me = this
    const inputEl = me._getInputEl()
    inputEl.value = ''
  }
  _cleanLocatedItem() {

  }
  search(location) {

  }
  /**
   * 清空搜索框和定位标记
   */
  clear() {
    const deleteBtn = this._getDeleteButtonEl()
    deleteBtn.style.display = 'none'
    this._cleanSearchBox()
    this._cleanLocatedItem()
  }
  onRemove() {
    delete this.mapWrapper.controls[this.CONTROL_KEY]
    super.onRemove()
  }
}

export default Locate
