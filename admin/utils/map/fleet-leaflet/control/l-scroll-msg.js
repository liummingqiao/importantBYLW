import * as L from 'leaflet'

import ScrollMsg from '../../std/control/scroll-msg'

export var UxScrollMsg = L.Control.extend({
  initialize: function(options) {
    var me = this
    L.setOptions(me, options)
    L.stamp(me)
    return me
  },
  onAdd: function(map) {
    var me = this
    me.el = me.options.el
    me.setVisible(this.options.visible)
    return me.el
  },
  setVisible: function(visible) {
    this.el.style.display = visible ? 'block' : 'none'
    this.options.visible = visible
  }
})

export default class LScrollMsg extends ScrollMsg {
  // constructor(opts) {
  //   super(opts)
  // }

  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxScrollMsg(me.options)
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
