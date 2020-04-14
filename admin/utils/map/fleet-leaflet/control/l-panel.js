import * as L from 'leaflet'

import Panel from '../../std/control/panel'

export var UxPanel = L.Control.extend({
  initialize: function(options) {
    var me = this
    L.setOptions(me, options)
    L.stamp(me)
    return me
  },
  onAdd: function(map) {
    var me = this
    me.el = me.options.el
    me._initStyle()
    me.setVisible(this.options.visible)
    if (this.options.resizable) {
      map.on('resize', this.tranferMapResize, this)
    }
    return me.el
  },
  onRemove: function() {
    this._map.off('resize', this.tranferMapResize, this)
    return this
  },
  _initStyle: function() {
    const el = this.el
    el.style.position = 'absolute'
    el.style.margin = '0'
    // el.style.right = '10px'
    el.style.zIndex = '840'
    // hack position
    this.dockTop = this.options.position.indexOf('top') !== -1
    this.dockLeft = this.options.position.indexOf('left') !== -1

    el.style[this.dockTop ? 'top' : 'bottom'] = this.options.vertical ? this.options.vertical : '50px'
    el.style[this.dockLeft ? 'left' : 'right'] = this.options.horizon ? this.options.horizon : '10px'
  },
  setVisible: function(visible) {
    this.el.style.display = visible ? 'block' : 'none'
    this.options.visible = visible
  },
  tranferMapResize(e) {
    this._map.fire('delegateresize', { delegate: this })
  }
})

export default class LPanel extends Panel {
  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxPanel(me.options)
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
