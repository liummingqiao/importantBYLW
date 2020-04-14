
import Legend from '../../std/control/legend'
import { UxPanel } from './l-panel'

export var UxLegend = UxPanel.extend({

})

export default class LLegend extends Legend {
  // constructor(opts) {
  //   super(opts)
  // }\

  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxLegend(me.options)
    return me
  }

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
