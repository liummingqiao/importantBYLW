import Panel from './panel'
import { DomUtil } from '../util/dom-util'

function Queue(size) {
  var list = []

  // 向队列中添加数据
  this.push = function(data) {
    if (data == null) {
      return false
    }
    // 如果传递了size参数就设置了队列的大小
    if (size != null && !isNaN(size)) {
      if (list.length === size) {
        list.shift()
      }
    }
    list.push(data)
    return true
  }

  // 从队列中取出数据
  this.pop = function() {
    return list.shfit()
  }

  // 返回队列的大小
  this.size = function() {
    return list.length
  }

  // 返回队列的内容
  this.list = function() {
    return list
  }

  this.reset = function() {
    list.length = 0
  }
}

const BASE_CLASS = 'fm-scroll-msg'
const DEFAULT_OPTIONS = {
  position: 'bottomright',
  visible: true,
  closeButton: false,
  hideOnClose: true,
  dragable: false,
  resizable: false,
  header: false,
  body: undefined, // HTML
  showTime: true,
  queueSize: 20,
  bodyStyle: {
    background: 'transparent',
    padding: '5px',
    margin: '0',
    height: '150px',
    width: '600px',
    overflow: 'auto',
    backgroundColor: 'white',
    borderRadius: '4px'
  }
}

class ScrollMsg extends Panel {
  /**
   * @constant
   * @property {string} CONTROL_KEY=scrollmsg 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'scrollmsg'
  events = []
  queue = undefined
  bodyEl = undefined
  /**
   * ScrollMsg 用于滚动显示 消息
   * @constructs ScrollMsg
   * @extends Panel
   * @memberof std/control/
   * @param {object} opts
   * @param {Position} [opts.position=bottomright]
   * @param {boolean} [opts.visible=true]
   * @param {boolean} [opts.header=false]
   * @param {boolean} [opts.resizable=false]
   * @param {boolean} [opts.showTime=true] 消息前是否显示时间
   * @param {integer} [opts.queueSize=20] 消息队列大小
   * @param {object} [opts.bodyStyle] 默认样式 <pre>
 bodyStyle: {
    background: 'transparent',
    padding: '5px',
    margin: '0',
    height: '150px',
    width: '600px',
    overflow: 'auto',
    backgroundColor: 'white',
    borderRadius: '4px'
  }
  </pre>
   *
   */
  constructor(opts) {
    super(opts)
    this.options = Object.assign({}, this.options, DEFAULT_OPTIONS, opts)
    this.queue = new Queue(this.options.queueSize)
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    this.onAdd(mapWrapper)
  }
  onAdd(mapWrapper) {
    this.update()
  }
  bodyHook() {
    const bodyEl = DomUtil.create('ul', BASE_CLASS)
    this.bodyEl = bodyEl
    return bodyEl
  }
  update() {
    const me = this
    me.bodyEl.innerHTML = ''
    me.queue.list().forEach(function(msg) {
      const item = DomUtil.create('li', BASE_CLASS + '-item', me.bodyEl)
      item.innerHTML = (me.options.showTime ? `[${msg.time.getHours().toString().padStart(2, '0')}:${msg.time.getMinutes().toString().padStart(2, '0')}:${msg.time.getSeconds().toString().padStart(2, '0')}.${msg.time.getMilliseconds().toString().padStart(3, '0')}]: ` : '') + msg.content
    })
    this.bodyEl.scrollTo(0, 500)
  }
  /**
   * 加入消息
   * @param {string} html html string
   */
  addMsg(html) {
    this.queue.push({
      time: new Date(),
      content: html
    })
    this.update()
  }
}

export default ScrollMsg
