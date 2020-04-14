import MapComponent from '../map-component'
import { DomUtil, DomEvent } from '../util/dom-util'

const BASE_CLASS = 'fm-panel'
const DEFAULT_OPTIONS = {
  position: 'topright',
  horizon: '10px',
  vertical: '50px',
  visible: true,
  closeButton: true,
  hideOnClose: true,
  dragable: true,
  resizable: false, // 注意，只有position = 'topleft' 时才会获得标准的resize效果，其他位置请自行修正，此效果为浏览器默认效果
  header: {
    icon: '',
    title: ''
  },
  bodyId: undefined,
  bodyStyle: undefined,
  body: undefined // HTML
}

var emptyImg = document.createElement('img')
class Panel extends MapComponent {
  /**
   * panel 显示时触发
   * @event Panel#show
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 触发事件的元素
   */
  /**
   * panel 隐藏时触发
   * @event Panel#hide
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 触发事件的元素
   */
  events = ['hide', 'show']
  mousePressed = false
  lastPressed = 0
  startDrag = false
  dockTop = true
  dockLeft = true
  dragCfg = {
    x: 0,
    y: 0,
    offsetTop: 0,
    offsetRight: 0
  }
  /**
   * 本类实现了地图 Control 的显示/隐藏，header, dragable, resizable基本功能，可扩展本组件实现自定义各种地图Control
   * @constructs Panel
   * @extends MapComponent
   * @memberof std/control/
   * @param {object} [opts]
   * @param {Position} [opts.position=topright] 组件 dock 在地图组件的位置
   * @param {string} [opts.horizon=10px] 组件与地图水平边的距离
   * @param {string} [opts.vertical=50px] 组件与地图垂直边的距离
   * @param {boolean} [opts.visible=true] 是否可见
   * @param {object|false} [opts.header] false: 无header
   * @param {string} [opts.header.title] header上显示的 title
   * @param {string} [opts.header.icon] header上显示的icon 的 url
   * @param {boolean} [opts.closeButton=true] header上显示的关闭按钮, 仅当header有效时起作用
   * @param {boolean} [opts.hideOnClose=true] 点击header上的关闭按钮时，仅调用控件的hide(); 当设置为 false时，调用destroy方法，意味着无法再 show()
   * @param {boolean} [opts.dragable=true] header支持拖动控件
   * @param {boolean} [opts.resizable=false] 注意，只有position = 'topleft' 时才会获得标准的resize效果，其他位置请自行修正，此效果为浏览器默认效果
   * @param {object} [opts.bodyStyle] 设置body的 css 样式
   */
  constructor(opts) {
    opts = opts || {}
    super(Object.assign({}, DEFAULT_OPTIONS, opts, {
      header: opts.header === false ? false : (Object.assign({}, DEFAULT_OPTIONS.header, opts.header)),
      bodyStyle: Object.assign({}, DEFAULT_OPTIONS.bodyStyle, opts.bodyStyle)
    }))
    if (this.options.position !== 'topright' &&
      this.options.position !== 'topleft' &&
      this.options.position !== 'bottomright' &&
      this.options.position !== 'bottomleft') {
      throw new Error(`position[${this.options.position}] supports "topright|topleft|bottomright|bottomleft" only!`)
    }
    this.dockTop = this.options.position.indexOf('top') !== -1
    this.dockLeft = this.options.position.indexOf('left') !== -1
    this.dockedVertical = this.dockTop ? 'top' : 'bottom'
    this.dockedHorizon = this.dockLeft ? 'left' : 'right'
  }
  uiHook() {
    const me = this
    const opts = me.options
    const container = DomUtil.create('div', BASE_CLASS)

    DomEvent.disableScrollPropagation(container)
      .disableClickPropagation(container)
      .disableMousePropagation(container)

    if (opts.header !== false) {
      const header = DomUtil.create('div', BASE_CLASS + '-header', container)
      if (opts.header.icon) {
        const icon = DomUtil.create('div', BASE_CLASS + '-header-icon', header)
        icon.style.backgroundImage = `url(${opts.header.icon})`
      }
      if (opts.dragable) {
        DomUtil.addClass(header, BASE_CLASS + '-draggable')
        header.draggable = true
        DomEvent.on(header, 'dragstart', this._onDragStart, me)
        DomEvent.on(header, 'dragend', this._onDragEnd, me)
        DomEvent.on(header, 'drag', this._onDrag, me)
        DomEvent.on(header, 'dragover', this._onDragOver, me)
      }

      const title = DomUtil.create('div', BASE_CLASS + '-header-title', header)
      title.innerHTML = opts.header.title
      if (opts.closeButton) {
        const closeButton = DomUtil.create('div', BASE_CLASS + '-header-close', header)
        closeButton.style.backgroundImage = `url(icons/map/close.svg)`
        closeButton.preventDragEvent = true
        closeButton.draggable = true
        DomEvent.on(closeButton, 'click', this._closeButtonEvent, me)
      }
    }

    const body = DomUtil.create('div', BASE_CLASS + '-body', container)
    if (this.options.bodyId) {
      body.id = this.options.bodyId
    }

    me._bodyEl = body

    if (me.options.resizable) {
      DomUtil.addClass(body, 'div-resizable')
    }
    Object.assign(body.style, this.options.bodyStyle)

    const bodyContent = me.bodyHook() || opts.body
    if (bodyContent) {
      if (bodyContent instanceof HTMLElement) {
        body.appendChild(bodyContent)
      } else {
        body.innerHTML = bodyContent
      }
    }
    return container
  }
  _onDragOver(ev) {
    ev.preventDefault()
  }
  _onDragStart(e) {
    // 如果点中的是不支持drag的控件
    if (e.target.preventDragEvent === true) {
      return
    }

    this.mousePressed = true
    this.startDrag = true
    this.lastPressed = e.timeStamp

    const container = this.getContainerElement()

    const mapEl = this.mapWrapper.mapEl
    const mapRect = mapEl.getBoundingClientRect()
    const panelRect = container.getBoundingClientRect()
    // 采集panel在地图内的初始偏移位置
    this.dragCfg.offsetTop = panelRect.top - mapRect.top
    this.dragCfg.offsetRight = mapRect.right - panelRect.right

    this.dragCfg.verticalOffset = this.dockTop ? (panelRect.top - mapRect.top) : (mapRect.bottom - panelRect.bottom)
    this.dragCfg.horizonOffset = this.dockLeft ? (panelRect.left - mapRect.left) : (mapRect.right - panelRect.right)

    this.dragCfg.top = panelRect.top
    this.dragCfg.right = panelRect.right

    this.dragCfg.mapRect = mapRect
    this.dragCfg.panelRect = panelRect

    this.dragCfg.clientX = e.clientX
    this.dragCfg.clientY = e.clientY

    this.dragCfg.layerX = e.layerX
    this.dragCfg.layerY = e.layerY

    this.dragCfg.x = e.x
    this.dragCfg.y = e.y

    e.dataTransfer.setDragImage(emptyImg, 5000, 5000)
  }
  _onDragEnd(e) {
    e.preventDefault()
    this.mousePressed = false
    if (this.options.resizable) {
      this._calculateMaxSize()
    }
  }
  _onDrag(e) {
    e.preventDefault()
    if (!this.mousePressed) {
      return
    }
    // 未移动，不作处理
    if (e.clientX === this.lastX && e.clientY === this.lastY) {
      return
    }
    // 第一个 drag 事件产生的event坐标存在异常
    if (this.startDrag === true) {
      this.startDrag = false
    }

    this._updatePosition(e)
    this.lastX = e.clientX
    this.lastY = e.clientY
  }
  _closeButtonEvent(e) {
    DomEvent.stopPropagation(e)
    e.preventDefault()
    if (this.options.hideOnClose) {
      this._beforeHide()
      this.hide()
    } else {
      this.destroy()
    }
  }
  _updatePosition(e) {
    // if (e.timeStamp - this.lastUpdate < 50) {
    //   return
    // }
    // 无效位置，drag发生时会丢出一个这种无效事件位置
    if (e.clientX === 0 || e.clientY === 0) {
      return
    }

    const container = this.getContainerElement()

    const movedX = e.clientX - this.dragCfg.clientX
    const movedY = e.clientY - this.dragCfg.clientY

    let horizonOffset = this.dragCfg.horizonOffset + movedX * (this.dockLeft ? 1 : -1)
    let verticalOffset = this.dragCfg.verticalOffset + movedY * (this.dockTop ? 1 : -1)

    const cornerTopLeft = {
      x: e.clientX - this.dragCfg.layerX,
      y: e.clientY - this.dragCfg.layerY
    }

    // 保证框体在地图内
    const mapEl = this.mapWrapper.mapEl
    const mapRect = mapEl.getBoundingClientRect()
    const panelRect = container.getBoundingClientRect()

    if (cornerTopLeft.x < mapRect.x) {
      horizonOffset = this.dockLeft ? 0 : mapRect.width - panelRect.width
    }
    if (cornerTopLeft.x > mapRect.x + mapRect.width - panelRect.width) {
      horizonOffset = this.dockLeft ? mapRect.width - panelRect.width : 0
    }

    if (cornerTopLeft.y < mapRect.y) {
      verticalOffset = this.dockTop ? 0 : mapRect.height - panelRect.height
    }
    if (cornerTopLeft.y > mapRect.y + mapRect.height - panelRect.height) {
      verticalOffset = this.dockTop ? mapRect.height - panelRect.height : 0
    }

    container.style[this.dockedHorizon] = horizonOffset + 'px'
    container.style[this.dockedVertical] = verticalOffset + 'px'

    this.lastUpdate = e.timeStamp
  }
  bodyHook() {

  }
  /**
   * 显示组件
   */
  show() {
    this._content.style.display = 'block'
    if (this.options.resizable) {
      this._calculateMaxSize()
    }
    this.fire('show')
  }
  _calculateMaxSize() {
    const container = this._bodyEl
    const mapEl = this.mapWrapper.mapEl
    const mapRect = mapEl.getBoundingClientRect()
    const panelRect = container.getBoundingClientRect()

    container.style.maxWidth = (mapRect.right - panelRect.right + panelRect.width) + 'px'
    container.style.maxHeight = (mapRect.bottom - panelRect.bottom + panelRect.height) + 'px'
  }
  onAdd(mapWrapper) {
    super.onAdd(mapWrapper)
    if (this.options.visible) {
      this.show()
    }
    if (this.options.resizable) {
      this.mapWrapper.mapCmp.on('delegateresize', this._calculateMaxSize, this)
    }
    return this
  }
  /**
   * 隐藏组件
   */
  hide() {
    this._content.style.display = 'none'
    this.fire('hide')
  }
  _beforeHide() {
    // hook method
  }
  /**
   * 设置是否可见
   * @param {boolean}
   */
  setVisible(visible) {
    if (visible) {
      this.show()
    } else {
      this.hide()
    }
  }
  onRemove() {
    if (this.options.resizable) {
      this.mapWrapper.mapCmp.off('delegateresize', this._calculateMaxSize, this)
    }
    this.fire('remove')
    super.onRemove()
  }
}

export default Panel
