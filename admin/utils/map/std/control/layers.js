import MapComponent from '../map-component'

const DEFAULT_BASE_TILE_LAYER_OPTIONS = {
  position: 'topright',
  hideSingleBase: true,
  visible: false,
  baseLayers: {
    baidu: [
      { title: locales.layers.baidu, type: 'normal' },
      { title: locales.layers.baidu_sat, type: 'sat' }
      // , { title: locales.layers.baidu_street, type: 'street' }
    ],
    gaode: [
      { title: locales.layers.gaode, type: 'normal', activated: true },
      { title: locales.layers.gaode_sat, type: 'sat' }
    ],
    OSM: [
      { title: locales.layers.osm, type: 'normal' }
    ],
    google: [
      { title: locales.layers.google, type: 'normal' },
      { title: locales.layers.google_sat, type: 'sat' }
      // , { title: locales.layers.google_street, type: 'street' }
    ],
    tencent: [
      { title: locales.layers.tencent, type: 'normal' },
      { title: locales.layers.tencent_sat, type: 'sat' }
    ]
  }
}

class Layers extends MapComponent {
  CONTROL_KEY = 'layers'
  /**
   * 地图底图切换组件
   * @constructs Layers
   * @extends MapComponent
   * @memberof std/control/
   * @param {object} opts
   * @param {Position} [opts.position=topright]
   * @param {boolean} [opts.visible=false]
   * @param {object} [opts.baseLayers] 目前支持的配置类型有：<ul>
      <li>gaode.normal</li>
   <li>gaode.sat</li>
   <li>OSM.normal</li>
   <li>tencent.normal</li>
   <li>tencent.sat</li>
   <li>google.normal</li>
   <li>google.sat</li>
   <li>baidu.normal</li>
   <li>baidu.sat</li>
      </ul>
   * @example
   mapWrapper.createBaseLayers({
  position: 'topright',
  hideSingleBase: true,
  visible: false,
  baseLayers: {
    baidu: [
      { title: locales.layers.baidu, type: 'normal' },
      { title: locales.layers.baidu_sat, type: 'sat' },
      { title: locales.layers.baidu_street, type: 'street' }
    ],
    gaode: [
      { title: locales.layers.gaode, type: 'normal', activated: true },
      { title: locales.layers.gaode_sat, type: 'sat' }
    ],
    OSM: [
      { title: locales.layers.osm, type: 'normal' }
    ],
    google: [
      { title: locales.layers.google, type: 'normal' },
      { title: locales.layers.google_sat, type: 'sat' },
      { title: locales.layers.google_street, type: 'street' }
    ],
    tencent: [
      { title: locales.layers.tencent, type: 'normal' },
      { title: locales.layers.tencent_sat, type: 'sat' }
    ]
  }
})
   */
  activated = ''

  constructor(opts) {
    super(opts)
    this.options = Object.assign({}, DEFAULT_BASE_TILE_LAYER_OPTIONS, opts)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
  }
  onAdd() {
    super.onAdd()
    this.mapWrapper.mapCmp.on('baselayerchange', this._onBaselayerChange, this)
  }
  _onBaselayerChange(e) {
    const tile = e.cfg.tileLayer.options.tile
    if (tile === 'baidu.street') {
      if (!this.baiduStreetPanel) {
        this.baiduStreetPanel = this.mapWrapper.createBaiduStreet()
      }
      this.baiduStreetPanel.enable()
    } else {
      if (this.baiduStreetPanel) {
        this.baiduStreetPanel.disable()
      }
    }

    if (tile === 'google.street') {
      if (!this.googleStreetPanel) {
        this.googleStreetPanel = this.mapWrapper.createGoogleStreet()
      }
      this.googleStreetPanel.enable()
    } else {
      if (this.googleStreetPanel) {
        this.googleStreetPanel.disable()
      }
    }

    this.activated = tile
  }
  onRemove() {
    super.onRemove()
    this.mapWrapper.mapCmp.off('baselayerchange', this._onBaselayerChange)
  }
  setVisible() {}
}

export default Layers
