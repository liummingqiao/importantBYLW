import * as L from 'leaflet'

import Toolbar from '../../std/control/toolbar'

var UxToolbar = L.Control.extend({
  initialize: function(options) {
    var me = this
    L.setOptions(me, options)
    L.stamp(me)
    return me
  },
  onAdd: function(map) {
    var me = this
    me.el = me.options.el
    return me.el
  }
})

var subMenuOptions = {
  position: 'topright',
  top: '50px',
  right: '10px',
  visible: false
}

var UxSubMenu = L.Control.extend({
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
    me.setVisible()
    return me.el
  },
  /*
    此方法用于处理 toolbar menu的样式，使其独立于control之外
   */
  _initStyle: function() {
    const el = this.el
    el.style.position = 'absolute'
    el.style.marginTop = '44px'
    el.style.right = '150px'
    el.style.zIndex = '850'
  },
  setVisible: function(visible) {
    this.el.style.display = visible ? 'block' : 'none'
    this.options.visible = visible
  }
})

export default class LToolbar extends Toolbar {
  // constructor(opts) {
  //   super(opts)
  // }
  subMenusCmps = []

  create() {
    const me = this
    Object.assign(this.options, {
      el: me.buildUI()
    })

    me._lcmp = new UxToolbar(me.options)
    me.subMenus.forEach(function(menu) {
      me.subMenusCmps.push(new UxSubMenu(Object.assign({}, {
        el: menu
      }, subMenuOptions)))
    })
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

    this.subMenusCmps.forEach(function(menuCmp) {
      menuCmp.addTo(mapWrapper.mapCmp)
    })
    return this
  }
  subMenuVisible(menuEl, visible) {
    super.subMenuVisible(menuEl, visible)
    this.subMenusCmps.forEach(function(menuCmp) {
      if (menuCmp.options.el === menuEl) {
        menuCmp.setVisible(visible)
      } else {
        menuCmp.setVisible(false)
      }
    })
  }
}
