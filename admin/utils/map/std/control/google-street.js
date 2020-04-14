import Panel from './panel'
import { DomUtil, DomEvent } from '../util/dom-util'

const BASE_CLASS = 'fm-google-street'
const DEFAULT_OPTIONS = {
  position: 'topleft',
  visible: true,
  closeButton: true,
  hideOnClose: true,
  dragable: true,
  resizable: true, // 注意，只有position = 'topleft' 时才会获得标准的resize效果，其他位置请自行修正，此效果为浏览器默认效果
  header: {
    icon: './icons/map/streetview.png',
    title: locales.streetview.google_title
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

class GoogleStreet extends Panel {
  initialized = false
  panoValid = false
  pickerEnabled = false
  enabled = false
  /**
   * 谷歌街景封装组件，必须加载谷歌javascript API
   * @constructs GoogleStreet
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
    bodyEl.id = 'panorama'
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
  onAdd() {
    super.onAdd()

    if (window.google) {
      this.panorama = new window.google.maps.StreetViewPanorama(
        document.getElementById('panorama'), {
          visible: false
        })

      this.panorama.parentCmp = this
      this.panorama.addListener('position_changed', this._panoChange, this)
      this.panorama.addListener('pov_changed', this._panoChange, this)
      this.panoService = new window.google.maps.StreetViewService()
    } else {
      throw new Error('Google Street View not found!')
    }
    return this
  }
  getStreetTile() {
    // 底层交互组件实现
  }

  firstPositionEvent = false
  // google panorama event listener
  _panoChange() {
    const pano = this
    const me = pano.parentCmp
    const position = pano.position
    const pov = pano.pov

    me._updateMarker({
      lng: position.lng(),
      lat: position.lat(),
      heading: pov.heading
    })
  }
  onMapClick(e) {
    const me = this
    const pano = me.panorama
    const infoEl = me.infoEl
    infoEl.innerHTML = locales.streetview.requesting
    pano.setVisible(false)
    const point = e.latlng
    me.disablePicker()
    me.setVisible(true)
    me.panoService.getPanorama({
      location: point
    }, function(data, status) {
      console.log(data, status)
      if (data === null) {
        infoEl.innerHTML = locales.streetview.not_found
        me.hideTracker()
        me.panoValid = false
      } else {
        me.panoValid = true
        infoEl.innerHTML = locales.streetview.initializing
        pano.setVisible(true)
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
   * 开启谷歌街景
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
   * 开启谷歌街景选取图标
   */
  enablePicker() {
    this.mapWrapper.grabClickEvent(this.onMapClick, this)
    // this.mapWrapper.mapEl.style.cursor = 'url(./icons/map/aero_pin.cur), auto;'
    DomUtil.addClass(this.mapWrapper.mapEl, 'street-picker')
    DomUtil.addClass(this.switchButton, BASE_CLASS + '-switch-selected')
    this.pickerEnabled = true
  }
  /**
   * 切换谷歌街景选取图标
   */
  switchPicker() {
    this.pickerEnabled ? this.disablePicker() : this.enablePicker()
  }
  /**
   * 关闭谷歌街景
   */
  disable() {
    this.disablePicker()
    this.setVisible(false)
    this.mapWrapper.removeTileLayer(this.getStreetTile())
    this.hideTracker()
    this.enabled = false
  }
  /**
   * 关闭谷歌街景选取图标
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

export default GoogleStreet
