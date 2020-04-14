var lastClick = 0
/**
 * 操作Dom事件的工具类
 * @class DomEvent
 * @alias DomEvent
 * @memberof std/util/
 */
export const DomEvent = (Object.freeze || Object)({
  eventKey: '_dom_events',
  /**
   * 监听HTMLElement 元素事件
   * @static
   * @memberof DomEvent
   * @param {HTMLElement} element  被监听的HTMLElement 元素
   * @param {string} types 事件类型 ，可以同时监听多个事件，以空格" "分割事件名，例如 'click mousedown mousemove'
   * @param {function} callback 事件触发后的回调
   * @param {scope} [scope=window] 回调函数中 this 的作用域
   */
  on: function(obj, types, fn, context) {
    if (typeof types === 'object') {
      for (var type in types) {
        this.addOne(obj, type, types[type], fn)
      }
    } else {
      types = DomUtil.splitWords(types)

      for (var i = 0, len = types.length; i < len; i++) {
        this.addOne(obj, types[i], fn, context)
      }
    }

    return this
  },
  /**
   * 解除监听HTMLElement 元素事件
   * @static
   * @memberof DomEvent
   * @param {HTMLElement} element  被监听的HTMLElement 元素
   * @param {string} types 事件类型 ，可以同时解除监听多个事件，以空格" "分割事件名，例如 'click mousedown mousemove'
   * @param {function} callback 事件触发后的回调，此callback必须为on 方法传入的指针，用于判断清理的监听方法
   * @param {scope} [scope=window] 回调函数中 this 的作用域，通常
   */
  off: function(obj, types, fn, context) {
    if (typeof types === 'object') {
      for (var type in types) {
        this.removeOne(obj, type, types[type], fn)
      }
    } else if (types) {
      types = DomUtil.splitWords(types)

      for (var i = 0, len = types.length; i < len; i++) {
        this.removeOne(obj, types[i], fn, context)
      }
    } else {
      for (var j in obj[this.eventsKey]) {
        this.removeOne(obj, j, obj[this.eventsKey][j])
      }
      delete obj[this.eventsKey]
    }

    return this
  },
  /**
   * 监听 <string>一次</string> HTMLElement 元素事件， 处理完毕后清除监听器
   * @static
   * @memberof DomEvent
   * @param {HTMLElement} element  被监听的HTMLElement 元素
   * @param {string} type 事件类型
   * @param {function} callback 事件触发后的回调
   * @param {scope} [scope=window] 回调函数中 this 的作用域，通常
   */
  addOne: function(obj, type, fn, context) {
    var id = type + DomUtil.stamp(fn) + (context ? '_' + DomUtil.stamp(context) : '')
    var me = this

    if (obj[this.eventsKey] && obj[this.eventsKey][id]) { return this }

    var handler = function(e) {
      return fn.call(context || obj, e || window.event)
    }

    // eslint-disable-next-line no-unused-vars
    var filterClick = function(e, handler) {
      var timeStamp = (e.timeStamp || (e.originalEvent && e.originalEvent.timeStamp))
      var elapsed = lastClick && (timeStamp - lastClick)
      if ((elapsed && elapsed > 100 && elapsed < 300) || (e.target._simulatedClick && !e._simulated)) {
        me.stop(e)
        return
      }
      lastClick = timeStamp
      handler(e)
    }

    var originalHandler = handler

    if ('addEventListener' in obj) {
      if (type === 'mousewheel') {
        obj.addEventListener('onwheel' in obj ? 'wheel' : 'mousewheel', handler, false)
      } else if ((type === 'mouseenter') || (type === 'mouseleave')) {
        handler = function(e) {
          e = e || window.event
          if (DomEvent.isExternalTarget(obj, e)) {
            originalHandler(e)
          }
        }
        obj.addEventListener(type === 'mouseenter' ? 'mouseover' : 'mouseout', handler, false)
      } else {
        if (type === 'click') {
          handler = function(e) {
            // 暂时不响应双击事件处理
            // filterClick(e, originalHandler)
            originalHandler(e)
          }
        }
        obj.addEventListener(type, handler, false)
      }
    } else if ('attachEvent' in obj) {
      obj.attachEvent('on' + type, handler)
    }

    obj[this.eventsKey] = obj[this.eventsKey] || {}
    obj[this.eventsKey][id] = handler
  },
  removeOne(obj, type, fn, context) {
    var id = type + DomUtil.stamp(fn) + (context ? '_' + DomUtil.stamp(context) : '')
    var handler = obj[this.eventsKey] && obj[this.eventsKey][id]

    if (!handler) { return this }

    if ('removeEventListener' in obj) {
      if (type === 'mousewheel') {
        obj.removeEventListener('onwheel' in obj ? 'wheel' : 'mousewheel', handler, false)
      } else {
        obj.removeEventListener(
          type === 'mouseenter' ? 'mouseover'
            : type === 'mouseleave' ? 'mouseout' : type, handler, false)
      }
    } else if ('detachEvent' in obj) {
      obj.detachEvent('on' + type, handler)
    }

    obj[this.eventsKey][id] = null
  },
  /**
   * 停止传递事件
   * @static
   * @memberof DomEvent
   * @param {Event} e Dom Event， HTML DOM Event 对象
   */
  stopPropagation: function(e) {
    if (e.stopPropagation) {
      e.stopPropagation()
    } else if (e.originalEvent) { // In case of Leaflet event.
      e.originalEvent._stopped = true
    } else {
      e.cancelBubble = true
    }

    return this
  },
  /**
   * 禁止传递mousewheel事件
   * @static
   * @memberof DomEvent
   * @param {Event} e Dom Event， HTML DOM Event 对象
   */
  disableScrollPropagation: function(el) {
    this.addOne(el, 'mousewheel', this.stopPropagation)
    return this
  },
  /**
   * 禁止传递click事件
   * @static
   * @memberof DomEvent
   * @param {Event} e Dom Event， HTML DOM Event 对象
   */
  disableClickPropagation: function(el) {
    this.on(el, 'click mousedown touchstart dblclick', this.stopPropagation)
    // this.addOne(el, 'click', this.fakeStop)
    return this
  },
  /**
   * 禁止传递mousemove事件
   * @static
   * @memberof DomEvent
   * @param {Event} e Dom Event， HTML DOM Event 对象
   */
  disableMousePropagation: function(el) {
    this.on(el, 'mousemove', this.stopPropagation)
    // this.addOne(el, 'click', this.fakeStop)
    return this
  },
  /**
   * 终止浏览器默认事件
   * @static
   * @memberof DomEvent
   * @param {Event} e Dom Event， HTML DOM Event 对象
   */
  preventDefault: function(e) {
    if (e.preventDefault) {
      e.preventDefault()
    } else {
      e.returnValue = false
    }
    return this
  },
  /**
   * 终止浏览器默认事件 并且 停止传递事件
   * @static
   * @memberof DomEvent
   * @param {Event} e Dom Event， HTML DOM Event 对象
   */
  stop: function(e) {
    this.preventDefault(e)
    this.stopPropagation(e)
    return this
  },
  getMousePosition: function(e, container) {
    if (!container) {
      return [e.clientX, e.clientY]
    }

    var scale = DomUtil.getScale(container)
    var offset = scale.boundingClientRect // left and top  values are in page scale (like the event clientX/Y)

    return [
      (e.clientX - offset.left) / scale.x - container.clientLeft,
      (e.clientY - offset.top) / scale.y - container.clientTop
    ]
  },
  getWheelDelta: function(e) {
    return ('msLaunchUri' in navigator && !('documentMode' in document)) /* edge */ ? e.wheelDeltaY / 2
      : (e.deltaY && e.deltaMode === 0) ? -e.deltaY
        : (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20
          : (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60
            : (e.deltaX || e.deltaZ) ? 0
              : e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2
                : (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20
                  : e.detail ? e.detail / -32765 * 60
                    : 0
  },
  skipEvents: {},
  fakeStop: function(e) {
    // fakes stopPropagation by setting a special event flag, checked/reset with skipped(e)
    this.skipEvents[e.type] = true
  },
  skipped: function(e) {
    var events = this.skipEvents[e.type]
    // reset when checking, as it's only used in map container and propagates outside of the map
    this.skipEvents[e.type] = false
    return events
  },
  isExternalTarget: function(el, e) {
    var related = e.relatedTarget

    if (!related) { return true }

    try {
      while (related && (related !== el)) {
        related = related.parentNode
      }
    } catch (err) {
      return false
    }
    return (related !== el)
  }
})

var lastId = 0
/**
 * 操作Dom元素的工具类
 * @class DomUtil
 * @alias DomUtil
 * @memberof std/util/
 */
export const DomUtil = (Object.freeze || Object)({
  TRANSFORM: 'transform',
  lastId: 0,
  /**
   * 为传入的对象打桩<br />
   * 如果对象已经有 _fm_id属性， 直接返回 _fm_id<br />
   * 如果对象没有 _fm_id 属性， 则注入到对象中，并返回 _fm_id
   * @static
   * @memberof DomUtil
   * @param {object} cmp 需要打桩的对象
   * @returns {integer} object._fm_id 的值
   */
  stamp: function(cmp) {
    cmp._fm_id = cmp._fm_id || ++lastId
    return cmp._fm_id
  },
  /**
   * document.getElementById()的封装
   * @static
   * @memberof DomUtil
   * @param {string} id 获取对象的 桩 ID
   * @returns {HTMLElement}
   */
  get: function(id) {
    return typeof id === 'string' ? document.getElementById(id) : id
  },
  /**
   * 为对象绑定一个方法
   * @static
   * @memberof DomUtil
   * @param {function} fn 进行绑定的方法
   * @param {object} obj 被绑定方法的对象
   * @returns {function} 绑定后的方法
   */
  bind: function(fn, obj) {
    var slice = Array.prototype.slice

    if (fn.bind) {
      // eslint-disable-next-line no-undef
      return fn.bind.apply(fn, slice.call(arguments, 1))
    }

    // eslint-disable-next-line no-undef
    var args = slice.call(arguments, 2)

    return function() {
      return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments)
    }
  },
  trim: function(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '')
  },
  splitWords(str) {
    return this.trim(str).split(/\s+/)
  },
  getStyle: function(el, style) {
    var value = el.style[style] || (el.currentStyle && el.currentStyle[style])

    if ((!value || value === 'auto') && document.defaultView) {
      var css = document.defaultView.getComputedStyle(el, null)
      value = css ? css[style] : null
    }
    return value === 'auto' ? null : value
  },
  /**
   * 创建 HTML 元素
   * @static
   * @memberof DomUtil
   * @param {string} tagName 创建html的 tag标签元素
   * @param {string} [className] tag 的 className属性值
   * @param {HTMLElement} [container] container.appendChild(<i>当前创建的元素</i>)
   * @returns {HTMLElement} 创建的HTMLELement
   */
  create: function(tagName, className, container, ns) {
    var el = ns ? document.createElementNS(ns, tagName) : document.createElement(tagName)
    el.setAttribute('class', className || '')

    if (container) {
      container.appendChild(el)
    }
    return el
  },
  /**
   * 在HTMLDom中移除当前HTMLElement
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 需要移除的HTMLElement
   */
  remove: function(el) {
    var parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  },
  /**
   * 清空所有子元素
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 移除el下的所有䛾
   */
  empty: function(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild)
    }
  },
  toFront: function(el) {
    var parent = el.parentNode
    if (parent && parent.lastChild !== el) {
      parent.appendChild(el)
    }
  },
  toBack: function(el) {
    var parent = el.parentNode
    if (parent && parent.firstChild !== el) {
      parent.insertBefore(el, parent.firstChild)
    }
  },
  /**
   * 判断是否存在className
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 进行判断的 HTMLElement
   * @param {string} className 检查的className
   * @returns {boolean}
   */
  hasClass: function(el, name) {
    if (el.classList !== undefined) {
      return el.classList.contains(name)
    }
    var className = this.getClass(el)
    return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className)
  },
  /**
   * 给HTMLElement 添加 className，不会重复添加相同名称
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 进行操作的 HTMLElement
   * @param {string} className 添加的 className
   */
  addClass: function(el, name) {
    if (el.classList !== undefined) {
      var classes = this.splitWords(name)
      for (var i = 0, len = classes.length; i < len; i++) {
        el.classList.add(classes[i])
      }
    } else if (!this.hasClass(el, name)) {
      var className = this.getClass(el)
      this.setClass(el, (className ? className + ' ' : '') + name)
    }
  },
  /**
   * 给HTMLElement 移除 className
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 进行操作的 HTMLElement
   * @param {string} className 移除的 className
   */
  removeClass: function(el, name) {
    if (el.classList !== undefined) {
      el.classList.remove(name)
    } else {
      this.setClass(el, this.trim((' ' + this.getClass(el) + ' ').replace(' ' + name + ' ', ' ')))
    }
  },
  /**
   * 给HTMLElement 替换 className
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 进行操作的 HTMLElement
   * @param {string} className 替换的 className
   */
  setClass: function(el, name) {
    if (el.className.baseVal === undefined) {
      el.className = name
    } else {
      // in case of SVG element
      el.className.baseVal = name
    }
  },
  /**
   * 获取当前元素的
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 进行操作的 HTMLElement
   * @param {float} value 透明度, 0~1
   */
  getClass: function(el) {
    // Check if the element is an SVGElementInstance and use the correspondingElement instead
    // (Required for linked SVG elements in IE11.)
    if (el.correspondingElement) {
      el = el.correspondingElement
    }
    return el.className.baseVal === undefined ? el.className : el.className.baseVal
  },
  /**
   * 设置元素的透明度
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 进行操作的 HTMLElement
   * @param {float} value 透明度, 0~1
   */
  setOpacity: function(el, value) {
    if ('opacity' in el.style) {
      el.style.opacity = value
    } else if ('filter' in el.style) {
      this._setOpacityIE(el, value)
    }
  },
  _setOpacityIE: function(el, value) {
    var filter = false
    var filterName = 'DXImageTransform.Microsoft.Alpha'

    // filters collection throws an error if we try to retrieve a filter that doesn't exist
    try {
      filter = el.filters.item(filterName)
    } catch (e) {
      // don't set opacity to 1 if we haven't already set an opacity,
      // it isn't needed and breaks transparent pngs.
      if (value === 1) { return }
    }

    value = Math.round(value * 100)

    if (filter) {
      filter.Enabled = (value !== 100)
      filter.Opacity = value
    } else {
      el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')'
    }
  },
  /**
   * 设置元素的transform属性
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el 进行操作的 HTMLElement
   * @param {object} offset 偏移的像素 {x: 50, y: -30}
   * @param {float} scale 缩放级别
   * @param {float} rotate 旋转的度数
   */
  setTransform: function(el, offset, scale, rotate) {
    var pos = offset
    var ie3d = 'ActiveXObject' in window && ('transition' in document.documentElement.style)

    el.style[this.TRANSFORM] =
      (ie3d ? 'translate(' + pos.x + 'px,' + pos.y + 'px)' : 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
      (scale ? ' scale(' + scale + ')' : '') + (rotate !== undefined ? ' rotate(' + rotate + 'deg)' : '')
  },
  setPosition(el, point, scale, rotate) {
    /*eslint-disable */
    el._leaflet_pos = point;
    /* eslint-enable */

    this.setTransform(el, point, scale, rotate)
  },
  getSizedParentNode: function(element) {
    do {
      element = element.parentNode
    } while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body)
    return element
  },
  getScale: function(element) {
    var rect = element.getBoundingClientRect() // Read-only in old browsers.

    return {
      x: rect.width / element.offsetWidth || 1,
      y: rect.height / element.offsetHeight || 1,
      boundingClientRect: rect
    }
  },
  /**
   * 获取两个HTMLElement左上角坐标的偏移量, el2 - el1
   * @static
   * @memberof DomUtil
   * @param {HTMLElement} el1 比较的元素1
   * @param {HTMLElement} el2 比较的元素2
   * @returns {object} 偏移量 {x: 50, y: 30}
   */
  getOffsetPosition: function(ref, el) {
    if (ref instanceof HTMLElement && el instanceof HTMLElement) {
      var refBound = ref.getBoundingClientRect()
      var elBound = el.getBoundingClientRect()
      return {
        x: elBound.x - refBound.x,
        y: elBound.y - refBound.y
      }
    }
    return undefined
  },
  moveInContainer: function(el, container) {

  }
})

export default { DomUtil, DomEvent }
