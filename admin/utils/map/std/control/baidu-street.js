import Panel from './panel'
import { DomUtil, DomEvent } from '../util/dom-util'

const BASE_CLASS = 'fm-baidu-street'
const DEFAULT_OPTIONS = {
  position: 'topleft',
  visible: true,
  closeButton: true,
  hideOnClose: true,
  dragable: true,
  resizable: true, // 注意，只有position = 'topleft' 时才会获得标准的resize效果，其他位置请自行修正，此效果为浏览器默认效果
  header: {
    icon: './icons/map/streetview.png',
    title: locales.streetview.baidu_title
  },
  bodyId: undefined,
  bodyStyle: {
    padding: '0 0 4px 0',
    backgroundColor: 'rgb(48,65,86)',
    width: '450px',
    height: '600px'
  },
  markerIcon: './icons/map/sign.png',
  body: undefined // HTML
}

class BaiduStreet extends Panel {
  initialized = false
  panoValid = false
  pickerEnabled = false
  enabled = false
  /**
   * 百度街景封装组件，必须加载百度 javascript API
   * @constructs BaiduStreet
   * @extends Panel
   * @memberof std/control/
   * @param {object} opts
   * @param {Position} [opts.position=topleft]
   * @param {boolean} [opts.visible=false]
   * @param {boolean} [opts.visible=true]
   * @param {boolean} [opts.dragable=true]
   * @param {boolean} [opts.resizable=true]
   * @param {string} [opts.markerIcon=./icons/map/sign.png] 全景图像在 地图上的反馈图标
   */
  constructor(opts) {
    opts = opts || {}
    super(Object.assign({}, DEFAULT_OPTIONS, opts, {
      header: opts.header === false ? false : (Object.assign({}, DEFAULT_OPTIONS.header, opts.header)),
      bodyStyle: Object.assign({}, DEFAULT_OPTIONS.bodyStyle, opts.bodyStyle)
    }))
  }
  bodyHook() {
    const bodyEl = DomUtil.create('div', BASE_CLASS + '-pano-container')
    bodyEl.id = 'baiduPanorama'
    this.infoEl = DomUtil.create('aside', BASE_CLASS + '-pano-info', bodyEl)
    this.infoEl.innerHTML = locales.streetview.default_msg
    this.switchButton = DomUtil.create('div', BASE_CLASS + '-switch', bodyEl)
    this.switchButton.title = locales.streetview.picker
    DomEvent.on(this.switchButton, 'click', this.switchPicker, this)
    this.tileSwitchButton = DomUtil.create('div', BASE_CLASS + '-switch-tile', bodyEl)
    this.tileSwitchButton.title = locales.streetview.tile_switch
    DomEvent.on(this.tileSwitchButton, 'click', this.switchTile, this)
    return bodyEl
  }
  onAdd(mapWrapper) {
    super.onAdd(mapWrapper)
    if (window.BMap) {
      this.panorama = new window.BMap.Panorama('baiduPanorama')
      this.panorama.parentCmp = this
      this.panorama.addEventListener('position_changed', this._panoChange, this)
      this.panorama.addEventListener('pov_changed', this._panoChange, this)
      this.panoService = new window.BMap.PanoramaService()
    } else {
      throw new Error('BMap.Panorama not found!')
    }
    return this
  }

  getStreetTile() {
    // 底层交互组件实现
  }

  firstPositionEvent = false
  // 仅限百度事件使用 , 百度框架返回的事件 this 作用域无法配置，只能是百度的控件本身
  _panoChange(event) {
    const pano = event.target
    const me = pano.parentCmp

    if (me.firstPositionEvent && event.type === 'onposition_changed') {
      // 此方法为hack方法，百度街景在重用同一个实例时会根据最后一次的位置判断当前位置的方向（连线），而第一次setPosition返回的Pov一定是0度（bug）
      setTimeout(function() {
        pano.setPov({ heading: 0, pitch: 0 })
        me.firstPositionEvent = false
      }, 0)
    }
    me._updateMarker({
      lng: event.target.getPosition().lng,
      lat: event.target.getPosition().lat,
      heading: event.target.getPov().heading
    })
  }
  _onBaseMapChange(e) {

  }
  onMapClick(e) {
    const me = this
    const pano = me.panorama
    const infoEl = me.infoEl
    pano.hide()
    const point = new window.BMap.Point(e.latlng.lng, e.latlng.lat)
    me.disablePicker()
    me.setVisible(true)
    infoEl.innerHTML = locales.streetview.requesting
    me.panoService.getPanoramaByLocation(point, function(data) {
      if (data === null) {
        infoEl.innerHTML = locales.streetview.not_found
        me.hideTracker()
        me.panoValid = false
      } else {
        me.panoValid = true
        infoEl.innerHTML = locales.streetview.initializing
        pano.show()
        me.firstPositionEvent = true
        pano.setPosition(point)
        me.showTracker()
        me.initialized = true
      }
    })
  }
  /**
   * 当前组件是否激活状态
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled
  }
  /**
   * 开启百度街景
   */
  enable() {
    // this.enablePicker()
    this.showTracker()
    this.enableTile()
    // if (this.initialized) {
    this.setVisible(true)
    // }
    this.enabled = true
  }
  reloadTile() {
    this.disableTile()
    this.enableTile()
  }
  /**
   * 开启百度街景选取图标
   */
  enablePicker() {
    this.mapWrapper.grabClickEvent(this.onMapClick, this)
    // this.mapWrapper.mapEl.style.cursor = 'url(./icons/map/aero_pin.cur), auto;'
    DomUtil.addClass(this.mapWrapper.mapEl, 'street-picker')
    DomUtil.addClass(this.switchButton, BASE_CLASS + '-switch-selected')
    this.pickerEnabled = true
  }
  /**
   * 切换选取图标
   */
  switchPicker() {
    this.pickerEnabled ? this.disablePicker() : this.enablePicker()
  }
  /**
   * 关闭百度街景
   */
  disable() {
    this.disablePicker()
    this.setVisible(false)
    this.hideTracker()
    this.disableTile()
    this.enabled = false
  }
  /**
   * 关闭百度街景选取图标
   */
  disablePicker() {
    this.mapWrapper.releaseGrabbed()
    DomUtil.removeClass(this.mapWrapper.mapEl, 'street-picker')
    // this.mapWrapper.mapEl.style.cursor = ''
    DomUtil.removeClass(this.switchButton, BASE_CLASS + '-switch-selected')
    this.pickerEnabled = false
  }
  /**
   * 显示全景反馈marker
   */
  showTrakcer() {
    // 显示全景反馈marker
  }
  /**
   * 隐藏全景反馈marker
   */
  hideTracker() {
    // 隐藏全景反馈marker
  }
  _beforeHide() {
    this.disable()
  }
  switchTile() {
    this.tileEnabled ? this.disableTile() : this.enableTile()
  }
  enableTile() {
    DomUtil.addClass(this.tileSwitchButton, BASE_CLASS + '-switch-tile-selected')
    this.mapWrapper.addTileLayer(this.getStreetTile())
    this.tileEnabled = true
  }
  disableTile() {
    DomUtil.removeClass(this.tileSwitchButton, BASE_CLASS + '-switch-tile-selected')
    this.mapWrapper.removeTileLayer(this.getStreetTile())
    this.tileEnabled = false
  }
}

export default BaiduStreet
