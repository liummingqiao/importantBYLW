import Overlays from '../../std/control/overlays'
import { UxPanel } from './l-panel'

var UxOverlays = UxPanel.extend({
})

export default class LOverlays extends Overlays {
  // constructor(opts) {
  //   super(opts)
  // }

  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxOverlays(me.options)
    return me
  }

  // createMenu(opts) {
  //   Object.assign({}, {
  //     el: this._configureMenu()
  //   })
  // }

  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    this._lcmp.addTo(mapWrapper.mapCmp)
    return this
  }
  getContainerElement() {
    return this._lcmp.el
  }
  destroy() {
    this.mapWrapper.removeControl(this._lcmp)
    this.onRemove()
  }
  onRemove() {
    super.onRemove()
  }
}
