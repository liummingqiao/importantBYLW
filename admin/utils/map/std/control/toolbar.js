import MapComponent from '../map-component'
import { DomUtil, DomEvent } from '../util/dom-util'

const BASE_CLASS = 'fm-toolbar'
const BASE_CLASS_VERTICAL = 'fm-toolbar-vertical'

const DEFAULT_OPTIONS = {
  visible: true,
  position: 'topright',
  items: undefined
}

class Toolbar extends MapComponent {
  /**
   * @constant
   * @property {string} CONTROL_KEY=toolbar 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'toolbar'
  subMenus = []
  /**
   * ScrollMsg 用于滚动显示 消息
   * @constructs Toolbar
   * @extends Panel
   * @memberof std/control/
   * @param {object} opts
   * @param {Position} [opts.position=topright]
   * @param {boolean} [opts.visible=true]
   * @param {object} [opts.items] 配置toolbar的完整内容，详情参考 example
   * @example
   {
  items: [
    {
      type: 'button',                           // 类型：按钮，目前仅支持按钮
      title: locales.toolbar.layers,            // 悬浮在按钮上显示的文字
      text: locales.toolbar.layers,             // 按钮的文字
      toggle: true,                             // 是否是按压效果的按钮，true,表示按一下，切换成按压状态，再点击切换正常状态。 false表示普通的单击按钮
      icon: 'icons/map/tile2.svg',              // 文字前显示的图标
      onclick: function(button, pressed) {      // 点击按钮后的回调方法
        this.mapWrapper.controls.overlays.setVisible(pressed)
        if (pressed) {
          this.mapWrapper.controls.overlays.once('hide', function(e) {
            if (button.pressed) {
              button.click()
            }
          })
        }
      }
    },
    {
      type: 'button',
      title: locales.toolbar.toolkits,
      text: locales.toolbar.toolkits,
      icon: 'icons/map/toolkit.svg',
      onclick: function() {
      },
      menu: [                                   // 配置了 menu则表示此 button 必然是 toggle=true, 且点击切换子菜单的显示/隐藏
        {                                       // 子菜单的配置方式与标准toolbar botton配置方式一致
          type: 'button',
          title: locales.toolbar.legend,
          text: locales.toolbar.legend,
          icon: 'icons/map/legend.svg',
          onclick: function(clickedItem) {
            this.mapWrapper.controls.legend.setVisible(clickedItem.checked)
            if (clickedItem.checked) {
              this.mapWrapper.controls.legend.once('hide', function() {
                clickedItem.setChecked(false)
              })
            }
          }
        }
      ]
    }
  ]
}
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  uiHook() {
    const me = this
    const opts = me.options
    const div = DomUtil.create('div', BASE_CLASS)
    me._parseConfiguration(div, opts.items, BASE_CLASS)

    return div
  }
  _parseConfiguration(ctx, items, baseClass) {
    const me = this
    items.forEach(function(item, idx) {
      if (typeof item === 'string') {
        switch (item) {
          case '|':
            var splitter = DomUtil.create('div', baseClass + '-splitter', ctx)
            DomUtil.create('div', baseClass + '-splitter-inner', splitter)
            break
          default:
            DomUtil.create('div', baseClass + '-label', ctx).innerHTML = item
            break
        }
      } else if (typeof item === 'object') {
        let cell, button, input, icon, text, suffix
        switch (item.type) {
          case 'input':
            input = DomUtil.create('input', baseClass + '-input', ctx)
            input.setAttribute('placeholder', item.placeholder)
            input.style.width = (item.width || 120) + 'px'
            input.cfg = item
            break
          case 'button':
          default:
            cell = DomUtil.create('div', baseClass + '-button-cell', ctx)
            cell.cfg = item

            button = DomUtil.create('a', baseClass + '-button', cell)
            button.eventTarget = cell
            if (item.icon) {
              icon = DomUtil.create('div', baseClass + '-button-icon', button)
              icon.style.backgroundImage = `url(${item.icon})`
              icon.eventTarget = cell
            }
            button.title = item.title
            if (item.text) {
              text = DomUtil.create('span', baseClass + '-button-text', button)
              text.eventTarget = cell
              text.innerText = item.text
            }

            if (item.icon && !item.text) {
              DomUtil.addClass(button, baseClass + '-button-icon-no-text')
            }

            item.toggle = item.toggle || item.menu !== undefined

            if (item.menu) {
              suffix = DomUtil.create('div', baseClass + '-button-menu-suffix', button)
              cell.menu = item.menu
              suffix.eventTarget = cell
              cell.menu.el = me._configureMenu(cell.menu, button)
              cell.menu.el.trigger = cell
            }
            DomEvent
              .on(cell, 'click', me._onButtonClick, me)
            break
        }
      }
    })
  }
  _configureMenu(menuCfg, target) {
    const me = this
    // const targetPosition = DomUtil.getOffsetPosition(me._getMapContainer(), target)
    const menuDiv = DomUtil.create('div', BASE_CLASS_VERTICAL)
    const ctx = DomUtil.create('ul', BASE_CLASS_VERTICAL + '-list', menuDiv)
    let cell, button, checkPoint, icon, text, suffix
    menuCfg.forEach(function(item, idx) {
      if (typeof item === 'string') {
        switch (item) {
          case '|':
            DomUtil.create('li', BASE_CLASS_VERTICAL + '-splitter', ctx)
            break
          default:
            DomUtil.create('li', BASE_CLASS_VERTICAL + '-label', ctx).innerHTML = item
            break
        }
      } else if (typeof item === 'object') {
        switch (item.type) {
          case 'button':
          default:
            cell = DomUtil.create('li', BASE_CLASS_VERTICAL + '-button-cell', ctx)
            cell.cfg = item
            cell._container = menuDiv

            button = DomUtil.create('div', BASE_CLASS_VERTICAL + '-button', cell)
            button.eventTarget = cell

            checkPoint = DomUtil.create('div', BASE_CLASS_VERTICAL + '-button-checkpoint', button)
            checkPoint.eventTarget = cell
            cell.checkPoint = checkPoint
            if (cell.checked) {
              DomUtil.removeClass(checkPoint, 'check-point-transparent')
            } else {
              DomUtil.addClass(checkPoint, 'check-point-transparent')
            }
            cell.setChecked = DomUtil.bind(function(checked) {
              this.checked = checked
              if (checked) {
                DomUtil.removeClass(this.checkPoint, 'check-point-transparent')
              } else {
                DomUtil.addClass(this.checkPoint, 'check-point-transparent')
              }
            }, cell)

            icon = DomUtil.create('div', BASE_CLASS_VERTICAL + '-button-icon', button)
            icon.style.backgroundImage = `url(${item.icon})`
            icon.eventTarget = cell

            button.title = item.title
            if (item.text) {
              text = DomUtil.create('div', BASE_CLASS_VERTICAL + '-button-text', button)
              text.eventTarget = cell
              text.innerText = item.text
            }

            if (item.icon && !item.text) {
              DomUtil.addClass(button, BASE_CLASS_VERTICAL + '-button-icon-no-text')
            }

            item.toggle = item.toggle || item.menu !== undefined

            if (item.menu) {
              suffix = DomUtil.create('div', BASE_CLASS_VERTICAL + '-button-menu-suffix', button)
              cell.menu = item.menu
              cell.menu.el = me._configureMenu(cell.menu, button)
              suffix.eventTarget = cell
            }
            DomEvent
              .on(cell, 'click', me._onMenuClick, me)
            break
        }
      }
    })

    me.subMenus.push(menuDiv)
    return menuDiv
  }
  _onButtonClick(e) {
    const me = this
    const button = e.target.eventTarget || e.target
    const lastActiveMenuButton = me.mapWrapper.lastActiveMenuButton
    const cfg = button.cfg

    // 点击button时, 如果当前正在有menu显示中，且点击的button不是menu所属的button, 则隐藏menu
    if (lastActiveMenuButton && lastActiveMenuButton !== button && lastActiveMenuButton.pressed) {
      lastActiveMenuButton.click()
    }

    if (cfg.toggle) {
      button.pressed = !button.pressed
      if (button.pressed) {
        DomUtil.addClass(button, BASE_CLASS + '-button-pressed')
      } else {
        DomUtil.removeClass(button, BASE_CLASS + '-button-pressed')
      }

      if (button.menu) {
        me.subMenuVisible(button.menu.el, button.pressed)
        this.mapWrapper.lastActiveMenuButton = button
      }
      if (typeof cfg.onclick === 'function') {
        cfg.onclick.apply(cfg.scope || me, [button, button.pressed])
      }
    } else {
      if (button.tb) {
        button.tb.setVisible(!this.options.visible)
      }
      if (typeof cfg.onclick === 'function') {
        cfg.onclick.apply(cfg.scope || me, [button])
      }
    }
  }
  _onMenuClick(e) {
    const me = this
    const button = e.target.eventTarget || e.target
    const cfg = button.cfg

    button.checked = !button.checked
    if (button.checked) {
      DomUtil.removeClass(button.checkPoint, 'check-point-transparent')
    } else {
      DomUtil.addClass(button.checkPoint, 'check-point-transparent')
    }
    // 业务处理，点中menu的项之后需要直接隐藏menu
    button._container.trigger.click()

    if (typeof cfg.onclick === 'function') {
      cfg.onclick.apply(cfg.scope || me, [button])
    }
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    super.addTo(mapWrapper)
  }
  subMenuVisible(menuEl, visible) {
    // 底层交互类实现菜单的隐藏/显示
  }
}

export default Toolbar
