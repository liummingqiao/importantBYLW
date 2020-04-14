import Panel from './panel'
import { DomUtil } from '../util/dom-util'

const ZTREE_ID = '__map_overlays'
const BASE_CLASS = 'fm-overlays-body'

const DEFAULT_OPTIONS = {
  visible: false,
  position: 'topleft',
  vertical: '65px',
  // 此方法为 hack方法，支持点击删除按钮后，有外部业务控制删除前的提示，返回 false则终止删除操作
  beforeRemoveHook: function(treeId, treeNode) {
    return true
  }
}

class Overlays extends Panel {
  treeId = ''
  /**
   * @constant
   * @property {string} CONTROL_KEY=overlays 注册到mapWrapper.controls中的key
   */
  CONTROL_KEY = 'overlays'

  /**
   * 树形控件的 checkbox 切换状态时触发
   * @event Overlays#layerchanged
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 触发事件的元素
   * @property {object} event.node 触发事件的节点数据
   * @property {boolean} event.oldValue check之前的状态
   * @property {boolean} event.value check当前的状态
   */
  /**
   * 树形控件的 range 组件值改变时触发
   * @event Overlays#rangechanged
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 触发事件的元素
   * @property {object} event.node 触发事件的节点数据
   * @property {integer} event.oldValue range改变之前的值
   * @property {integer} event.value range的当前值
   */
  /**
   * 树形控件的 item删除 时触发
   * @event Overlays#itemremove
   * @property {object} event
   * @property {string} event.type 事件类型
   * @property {ref} event.target 触发事件的元素
   * @property {object} event.node 触发事件的节点数据
   */
  events = ['layerchanged', 'rangechanged', 'itemremove']
  ztreeSetting = {}
  ztreeDiyDom = function(treeId, treeNode) {
    var aObj = _$('#' + treeNode.tId + '_a')
    if (treeNode.rangeEnable) {
      const range = DomUtil.create('input')
      range.id = treeNode.tId + '_range'
      range.type = 'range'
      range.value = treeNode.rangeValue === undefined ? 100 : treeNode.rangeValue // 默认值
      range.style.display = treeNode.checked ? 'inline-block' : 'none'
      range.treeNode = treeNode
      aObj.after(range)
    }
  }
  /**
   * Overlays 组件通过组织 ztree 组件，对ztree的行为进行封装，并将树行为的事件向外部传递
   * @constructs Overlays
   * @extends Panel
   * @memberof std/control/
   * @param {object} opts
   * @param {Position} [opts.position=topleft]
   * @param {boolean} [opts.visible=false]
   * @param {boolean} [opts.closeButton=true]
   * @param {boolean} [opts.dragable=true]
   * @param {boolean} [opts.resizable=false]
   * @param {function} [opts.beforeRemoveHook] hook方法，在删除元素前调用，返回true则继续删除元素，返回false终止
   * @param {object} [opts.nodeData] 组织 ztree 的数据结构以及节点形态， 详情请参考 example
   * @example
  {
    visible: false,
    position: 'topleft',
    header: {
      icon: 'icons/map/layer_icon2.svg',
      title: locales.toolbar.layers
    },
    beforeRemoveHook: function(treeId, treeNode) {
      // 判断是否继续删除节点，返回true则删除， 返回false则终止删除操作
      return confirm(`确认删除 节点 -- ${JSON.stringify(treeNode)} 吗？`)
    },
    nodeData: [
      {
        name: 'GridParam_LTE_DM_201909', // 节点显示名称
        open: true,                      // 是否展开，当有 children节点时生效
        removeEnable: true,              // 该节点是否可删除，default: false
        rangeEnable: false,              // 该节点是否加载 range组件， default: false
        checked: false,                  // 该节点是否选择中， default: false
        children: [                      // 子节点
          {
            name: '20190905_27W',               // 节点显示名称
            icon: 'icons/map/layers-icon.png',  // 节点自定义图标
            removeEnable: true,                 // 允许删除
            rangeEnable: true,                  // 选中后显示 range组件
            rangeValue: 70,                     // range组件的默认值，default: 100， 有效范围: 0~100
            checked: false,                     // 该节点是否选择中
            traceId: '20190905_27W',            // 一些自定义的数据，可在事件对象中的node获得
            dataId: '20190905_27W.json'         // 一些自定义的数据，可在事件对象中的node获得
          }
        ]
      },
      { name: '扇区层示例', icon: 'icons/map/layers-icon.png', checked: false, rangeEnable: true, traceId: 'demo_cell' },
      { name: '扇区密集程度示例(热力图)', icon: 'icons/map/layers-icon.png', checked: false, rangeEnable: true, traceId: 'demo_heatmap' }
    ]
  }
   */
  constructor(opts) {
    super(opts)
    this.treeId = ZTREE_ID + '_' + DomUtil.stamp(this)
    this.options = Object.assign({}, this.options, DEFAULT_OPTIONS, opts)

    const me = this
    this.ztreeSetting = {
      view: {
        addDiyDom: this.ztreeDiyDom,
        txtSelectedEnable: false
      },
      edit: {
        enable: true,
        showRemoveBtn: me._showTreeRemoveBtn,
        showRenameBtn: false
      },
      check: {
        enable: true,
        autoCheckTrigger: true
      },
      callback: {
        onCheck: function(ev, treeId, checkNode) {
          const nodes = _$.fn.zTree.getZTreeObj(treeId).getChangeCheckedNodes()
          nodes.forEach(function(node) {
            _$('#' + node.tId + '_range').css('display', node.checked ? 'inline-block' : 'none')

            me.fire('layerchanged', {
              node: node,
              oldValue: node.checkedOld,
              value: node.checked
            })

            node.checkedOld = node.checked
          })
        },
        beforeRemove: this.options.beforeRemoveHook,
        onRemove: function(ev, treeId, treeNode) {
          me.fire('itemremove', {
            node: treeNode
          })
        }
      }
    }
  }
  addTo(mapWrapper) {
    super.addTo(mapWrapper)
    mapWrapper.controls[this.CONTROL_KEY] = this
    this.onAdd(mapWrapper)
  }
  onAdd(mapWrapper) {
    // add 完控件后需要等UI渲染完成
    const me = this
    setTimeout(function() {
      me._tree = _$.fn.zTree.init(_$('#' + me.treeId), me.ztreeSetting, me.options.nodeData)
      setTimeout(function() {
        _$('input[type=range]').on('input', function() {
          _$(this).css('background', 'linear-gradient(to right, #059CFA, white ' + this.value + '%, white)')
          const treeNode = _$(this).prop('treeNode')
          me.fire('rangechanged', {
            node: treeNode,
            oldValue: treeNode.rangeValueOld,
            value: this.value
          })
          treeNode.rangeValueOld = this.value
        })
      }, 100)
    }, 100)

    return me
  }
  bodyHook() {
    const body = DomUtil.create('ul', BASE_CLASS + ' ztree')
    body.id = this.treeId
    return body
  }
  onRemove() {
    delete this.mapWrapper.controls[this.CONTROL_KEY]
    _$.fn.zTree.destroy(this.treeId)
  }
  _showTreeRemoveBtn(treeId, treeNode) {
    return treeNode.removeEnable
  }
  /**
   * 设置节点是否选中
   * @param {ZTreeNode} node ztree 的 node
   * @param {boolean|undefined} checked 是否选中， undefined的效果为toggle
   */
  checkNode(node, checked) {
    this._tree.checkNode(node, checked, true, true)
  }
  /**
   * 获得树结构的完整nodes
   * @returns {ZTreeNode}
   */
  getTreeNodes() {
    return this._tree.getNodes()
  }
  /**
   * 根据field的值精确匹配节点
   * @param {string} field node中的key field
   * @param {any} value 查找的值
   */
  fetchNode(field, value) {
    return this._tree.getNodeByParam(field, value)
  }
  /**
   * 添加Node
   * @param {ZTreeNode} parentNode 从ZTree返回的节点
   * @param {...object} newNodes 添加一个或者多个节点
   * @param {boolean} [silent=false] 当silent=true, 添加子节点时父节点不展开
   * @returns {ZTreeNode[]} 返回添加后的 ZTree 节点
   */
  addNode(parentNode, newNodes, silent) {
    return this._tree.addNodes(parentNode, newNodes, silent)
  }
  /**
   * 删除node节点
   * @param {ZTreeNode} node 需要删除的节点
   * @param {boolean} [emitEvent=false] 是否触发事件
   */
  removeNode(node, emitEvent) {
    this._tree.removeNode(node, emitEvent)
  }
}

export default Overlays
