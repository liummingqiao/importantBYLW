import Panel from './panel'
import { DomUtil, DomEvent } from '../util/dom-util'
import * as d3 from 'd3'

const BASE_CLASS = 'fm-legend-body'

const DEFAULT_OPTIONS = {
  position: 'topright',
  header: {
    icon: '/static/icons/map/legend_icon.svg',
    title: locales.legend.title
  },
  visible: false,
  closeButton: true,
  hideOnClose: true,
  dragable: true,
  resizable: false, // TODO 待实现
  body: '', // HTML
  bodyStyle: {
    maxWidth: '300px',
    maxHeight: '450px',
    overflowY: 'auto',
    overflowX: 'hidden'
  }
}

class Legend extends Panel {
  /**
   * @constant
   * @property {string} CONTROL_KEY=legend 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'legend'
  events = []

  layers = {}
  /**
   * 图例控件，支持Grouping注册到legend中，关联overlay的数据计数，可见性，透明度属性
   * @constructs Legend
   * @extends Panel
   * @memberof std/control/
   * @param {object} opts
   * @param {Position} [opts.position=topright]
   * @param {boolean} [opts.visible=false]
   * @param {boolean} [opts.closeButton=true]
   * @param {boolean} [opts.dragable=true]
   * @param {boolean} [opts.resizable=false]
   * @param {object} [opts.bodyStyle]
   * @param {string} [opts.bodyStyle.maxWidth=300px]
   * @param {string} [opts.bodyStyle.maxHeight=450px]
   * @param {string} [opts.bodyStyle.overflowX=hidden]
   * @param {string} [opts.bodyStyle.overflowY=auto]
   */
  constructor(opts) {
    opts = opts || {}
    super(Object.assign({}, DEFAULT_OPTIONS, opts, {
      header: Object.assign({}, DEFAULT_OPTIONS.header, opts.header),
      bodyStyle: Object.assign({}, DEFAULT_OPTIONS.bodyStyle, opts.bodyStyle)
    }))
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    this.onAdd(mapWrapper)
  }
  onAdd(mapWrapper) {
  }
  bodyHook() {
    const body = DomUtil.create('table', BASE_CLASS)
    // body.id = ZTREE_ID
    this.bodyEl = body
    return body
  }
  /**
   * 将一个 grouping overlay 注册到Legend中，legend将监听overlay的storechange, visiblechange事件并更新legend
   * @param {GroupingOverlay} layer
   */
  register(layer) {
    if (!layer.getStore || !layer.getLegends) {
      throw new Error('layer.getStore() and layer.getLegends() are required!')
    }

    const me = this
    me.layers[DomUtil.stamp(layer)] = layer
    layer.on('storechange', me._update, me)
    layer.on('visiblechange', me._update, me)
    layer.on('remove', me._onLayerRemove, me)
    this._update()
  }
  /**
   * 注销一个overlay, 并解除overlay的事件绑定
   * @param {GroupingOverlay} layer
   */
  unregister(layer) {
    const me = this
    const exists = me.layers[DomUtil.stamp(layer)]
    if (exists) {
      exists.off('storechange', me._update, me)
      exists.off('visiblechange', me._update, me)
      exists.off('remove', me._onLayerRemove, me)
      delete me.layers[DomUtil.stamp(layer)]
    }
    this._update()
  }
  _onLayerRemove(e) {
    this.unregister(e.target)
  }
  onRemove() {
    delete this.mapWrapper.controls[this.CONTROL_KEY]
  }
  _update() {
    const me = this
    const layers = me.layers
    const listEl = me.bodyEl
    let store, legends, layerName, legend

    let rowEl, groupCount, groupPercent,
      groupEl, collapseEl, groupCheckEl, itemEl, colorEl, checkEl, labelEl, extendFields,
      itemDevice, itemCount, itemPercent, legendNumbers

    let allChildrenChecked = true

    listEl.innerHTML = ''

    Object.values(layers).forEach(function(layer) {
      store = layer.getStore()
      if (!store) {
        return
      }

      legends = layer.getLegends()
      layerName = layer.getName()
      legendNumbers = me._calculateCount(layer)

      // groupEl = DomUtil.create('li', BASE_CLASS + '-item-group', listEl);
      rowEl = DomUtil.create('tr', BASE_CLASS + '-item-row', listEl)
      groupEl = DomUtil.create('td', BASE_CLASS + '-item-group', rowEl)
      groupCheckEl = DomUtil.create('input', BASE_CLASS + '-item-group-check', groupEl)
      groupCheckEl.setAttribute('type', 'checkbox')
      labelEl = DomUtil.create('span', BASE_CLASS + '-item-group-label', groupEl)
      labelEl.innerHTML = layerName
      labelEl.title = layerName
      collapseEl = DomUtil.create('div', BASE_CLASS + '-item-group-collapse-icon', groupEl)
      if (layer.legendCollapse) {
        collapseEl.style.transform = 'rotate(180deg)'
      }

      groupCount = DomUtil.create('td', BASE_CLASS + '-item-group-count', rowEl)
      groupCount.innerHTML = legendNumbers.num.total
      groupPercent = DomUtil.create('td', BASE_CLASS + '-item-group-perc', rowEl)
      DomEvent.on(collapseEl, 'click', me._onGroupCollExpClick, me)

      extendFields = {
        delegateEl: groupEl,
        checkEl: groupCheckEl,
        countEl: groupCount,
        percentEl: groupPercent,
        layer: layer
      }
      Object.assign(groupEl, extendFields, { _children: [] })
      Object.assign(groupCheckEl, extendFields)
      Object.assign(labelEl, extendFields)
      Object.assign(collapseEl, extendFields)

      DomEvent.on(groupCheckEl, 'click', me._onGroupClick, me)
      DomEvent.on(labelEl, 'click', me._onGroupClick, me)

      allChildrenChecked = true

      Object.keys(legends).forEach(function(legendKey) {
        legend = legends[legendKey]
        rowEl = DomUtil.create('tr', BASE_CLASS + '-item-row', listEl)
        if (layer.legendCollapse) {
          rowEl.style.display = 'none'
        }

        itemEl = DomUtil.create('td', BASE_CLASS + '-item', rowEl)
        DomUtil.create('div', BASE_CLASS + '-list-offset', itemEl)
        groupEl._children.push(itemEl)

        checkEl = DomUtil.create('input', BASE_CLASS + '-item-check', itemEl)
        checkEl.setAttribute('type', 'checkbox')
        if (legend.visible) {
          checkEl.setAttribute('checked', 'checked')
        } else {
          allChildrenChecked = false
        }

        colorEl = DomUtil.create('div', BASE_CLASS + '-item-color', itemEl)
        if (legend.icon) {
          colorEl.style.backgroundImage = `url(${legend.iconImg ? legend.iconImg.src : legend.icon})`
          colorEl.style.backgroundSize = `100%`
        } else {
          colorEl.style.backgroundColor = legend.color
        }
        labelEl = DomUtil.create('span', BASE_CLASS + '-item-label', itemEl)
        labelEl.innerHTML = legendKey

        itemCount = DomUtil.create('td', BASE_CLASS + '-item-group-count', rowEl)
        itemCount.innerHTML = legendNumbers.num[legendKey] !== undefined ? legendNumbers.num[legendKey] : '-'
        itemPercent = DomUtil.create('td', BASE_CLASS + '-item-group-perc', rowEl)
        itemPercent.innerHTML = legendNumbers.perc[legendKey] ? legendNumbers.perc[legendKey] : 'N/A'

        extendFields = {
          delegateEl: itemEl,
          checkEl: checkEl,
          deviceEl: itemDevice,
          countEl: itemCount,
          percentEl: itemPercent,
          rowEl: rowEl,
          legendKey: legendKey,
          layer: layer
        }
        Object.assign(itemEl, extendFields, { _parent: groupEl })
        Object.assign(checkEl, extendFields)
        Object.assign(colorEl, extendFields)
        Object.assign(labelEl, extendFields)

        DomEvent.on(checkEl, 'click', me._onItemClick, me)
        DomEvent.on(colorEl, 'click', me._onItemClick, me)
        DomEvent.on(labelEl, 'click', me._onItemClick, me)
      })

      groupCheckEl.checked = allChildrenChecked
    })
  }
  // 数据结构：
  // var retValue = {
  //   num: {
  //     'LTE RSRP good': 50,
  //     'LTE RSRP normal': 30,
  //     'LTE RSRP bad': 20,
  //     total: 1000
  //   },
  //   perc: {
  //     'LTE RSRP good': '50%',
  //     'LTE RSRP normal': '30%',
  //     'LTE RSRP bad': '20%',
  //     total: ''
  //   }
  // };
  _calculateCount(layer) {
    let legend

    const store = layer.getStore()
    const legends = layer.getLegends()

    var retValue = {
      num: {
        total: 0
      },
      perc: {
        total: ''
      }
    }

    for (const k in legends) {
      legend = legends[k]
      if (legend.visible) {
        retValue.num[k] = store.getGroup(k).getCount()
        retValue.num.total += store.getGroup(k).getCount()
      }
    }

    for (const k in legends) {
      legend = legends[k]
      if (retValue.num[k] >= 0) {
        retValue.perc[k] = (retValue.num[k] / retValue.num.total * 100).toFixed(2)
        if (retValue.perc[k] !== 'NaN') {
          retValue.perc[k] += '%'
        } else {
          retValue.perc[k] = 'N/A'
        }
      }
    }

    return retValue
  }
  _onGroupCollExpClick(e) {
    var img = e.target
    var g = img.delegateEl
    var children = g._children

    if (!img.layer.legendCollapse) {
      for (const i in children) {
        children[i].rowEl.style.display = 'none'
      }
      img.layer.legendCollapse = true
      d3.select(img)
        .style('transform', 'rotate(0deg)')
        .transition()
        .duration(300)
        .style('transform', 'rotate(180deg)')
    } else {
      for (const i in children) {
        children[i].rowEl.style.display = ''
      }
      img.layer.legendCollapse = false
      d3.select(img)
        .transition()
        .duration(300)
        .styleTween('transform', function() {
          return function(t) {
            return 'rotate(' + (t * 180 + 180) + 'deg)'
          }
        })
    }
  }
  _onGroupClick(e) {
    const target = e.target
    const d = target.delegateEl
    const c = target.checkEl

    if (c !== target) { // 跳过check的事件，无法屏蔽默认事件，check的click事件获取到的是改变之后的状态，所以不需要改变状态
      c.checked = !c.checked
    }
    d.layer.setVisible(c.checked)
  }
  _onItemClick(e) {
    const target = e.target
    const d = target.delegateEl
    const c = target.checkEl

    if (c !== target) { // 跳过check的事件，无法屏蔽默认事件，check的click事件获取到的是改变之后的状态，所以不需要改变状态
      c.checked = !c.checked
    }
    d.layer.setVisible(c.checked, d.legendKey)
  }
}

export default Legend
