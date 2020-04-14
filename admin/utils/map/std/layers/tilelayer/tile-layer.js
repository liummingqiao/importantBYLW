import MapComponent from '../../map-component'

const DEFAULT_TILE_LAYER_OPTIONS = {
  tile: 'baidu.sat'
}

export default class TileLayer extends MapComponent {
  constructor(opts) {
    super(opts)
    this.options = Object.assign({}, DEFAULT_TILE_LAYER_OPTIONS, opts)
  }
}
