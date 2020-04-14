import MapComponent from '../map-component'
import { DomUtil, DomEvent } from '../util/dom-util'

const BASE_CLASS = 'fm-panel'
const DEFAULT_OPTIONS = {
  visible: true,
  closeButton: true,
  hideOnClose: true,
  dragable: true,
  resizable: true, // TODO 待实现
  header: {
    icon: '',
    title: ''
  },
  body: undefined // HTML
}

var emptyImg = document.createElement('img')
export default class Panel extends MapComponent {
  // hide: panel 隐藏时触发
  // remove: 控件移除时触发
  events = ['hide', 'remove']
  mousePressed = false
  lastPressed = 0
  startDrag = false
  dragCfg = {
    x: 0,
    y: 0,
    offsetTop: 0,
    offsetRight: 0
  }
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }
  uiHook() {
    const me = this
    const opts = me.options
    const container = DomUtil.create('div', BASE_CLASS)

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
    window.dragTarget = e.target
    window.dragEvent = e
    console.log(e.target.preventDragEvent)

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

    this.dragCfg.x = e.x
    this.dragCfg.y = e.y
    e.dataTransfer.setDragImage(emptyImg, 5000, 5000)
  }
  _onDragEnd(e) {
    e.preventDefault()
    this.mousePressed = false
  }
  _onDrag(e) {
    e.preventDefault()
    if (!this.mousePressed) {
      return
    }
    // 未移动，不作处理
    if (e.x === this.lastX && e.y === this.lastY) {
      return
    }
    // 第一个 drag 事件产生的event坐标存在异常
    if (this.startDrag === true) {
      this.startDrag = false
    }
    this._updatePosition(e)
    this.lastX = e.x
    this.lastY = e.y
  }
  _closeButtonEvent(e) {
    DomEvent.stopPropagation(e)
    e.preventDefault()
    if (this.options.hideOnClose) {
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
    if (e.offsetX < 0 || e.offsetY < 0) {
      return
    }

    const container = this.getContainerElement()
    const movedX = e.x - this.dragCfg.x
    const movedY = e.y - this.dragCfg.y

    let right = this.dragCfg.offsetRight - movedX
    let top = movedY + this.dragCfg.offsetTop

    // 保证框体在地图内
    const mapEl = this.mapWrapper.mapEl
    const mapRect = mapEl.getBoundingClientRect()
    const panelRect = container.getBoundingClientRect()

    if (right < 0) {
      right = 0
    }
    if (right + panelRect.width > mapRect.width) {
      right = mapRect.width - panelRect.width
    }
    if (top < 0) {
      top = 0
    }
    if (top + panelRect.height > mapRect.height) {
      top = mapRect.height - panelRect.height
    }

    container.style.right = right + 'px'
    container.style.top = top + 'px'

    this.lastUpdate = e.timeStamp
  }
  bodyHook() {

  }
  show() {
    this._content.style.display = 'block'
  }
  hide() {
    this._content.style.display = 'none'
    this.fire('hide')
  }
  setVisible(visible) {
    if (visible) {
      this.show()
    } else {
      this.hide()
    }
  }
  onRemove() {
    this.fire('remove')
  }
}
