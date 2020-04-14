import { DomUtil } from './util/dom-util'
import Evented from './util/evented'

/*
 * ==== 张果知 在 2020/03/11 21:16 留下人生第一段代码 start ====
 * @C NNNNNNNNNNN.FFFFFFFFFFFFFNN...
 * N                    O
 * ==== 张果知 在 2020/03/11 21:16 留下人生第一段代码 end ====
 */

class MapWrapper extends Evented {
  /**
   * 当前 Fleet Map组件的版本号
   * @readonly
   * @property {string} version  当前 Fleet Map组件的版本号
   */
  version = '1.1.0'

  events = ['baselayerchange', 'crschange']

  _notifications = []

  /**
   * 此属性放置地图上创建的所有control, 由需要注册的control自己定义注册key, 参考 control.CONTROL_KEY
   * @property {object} controls  快速获得control方式： mapWrapper.controls.coordPicker
   */
  controls = {}
  /**
   * 存储加入地图的所有layers
   * @property {object} layers key为 layer._fm_id
   */
  layers = {}
  /**
   * 渲染地图控件的DIV元素
   * @property {HTMLElement} mapEl 渲染地图控件的DIV元素
   */
  mapEl = undefined
  /**
   * 地图是否正在移动
   * @readonly
   * @property {boolean} moving=false 当地图被拖动时，状态为 true, 拖动结束时恢复 false
   */
  moving = false
  /**
   * 地图事件是否正在被绑架
   * @readonly
   * @property {boolean} grabing=false 当调用方法 {@link MapWrapper#grabClickEvent} 时，属性为true, 地图默认悬停，点击事件会被忽略， MapWrapper#releaseGrabbed() 释放事件绑架，属性重置为 false
   *
   */
  grabing = false
  /**
   * 当前浏览器是否支持使用 webgl
   * @readonly
   * @property {boolean}
   */
  useWebGl = true
  /**
   * webgl context上限，当请求超过上限的数据渲染图层时，改用低性能图层替代（canvas2d)
   * @readonly
   * @property {integer} webGlLimit=16
   */
  webGlLimit = 16
  /**
   * 本类相当于接口，实现该接口类的目的为可对应实现不同地图框架的支持<br />
   * 如果使用typescript, 外部将到  mapWrapper: MapWrapper = new LeafletWrapper()
   * 根据div id与配置初始化地图组件
   * @since 1.0.0
   * @constructs MapWrapper
   * @memberof std/
   * @param {string} divId 用于渲染的外部DIV ID，必须有宽高，否则地图渲染会失败
   * @param {object} options 地图初始化配置
   * @param {boolean} [options.scalecontrol=false] 是否加载默认 比例尺组件
   * @param {boolean} [options.zoomcontrol=false] 是否加载默认 zoom组件
   * @param {boolean|object} [options.toolbar=false] 是否加载默认 toolbar组件， 使用 object配置请参考 [std/control/Toolbar]{@link Toolbar}
   * @param {boolean|object} [options.baselayer=false] 是否加载默认 layers组件， 使用 object配置请参考 [std/control/Layers]{@link Layers}
   * @param {boolean|object} [options.legend=false] 是否加载默认 legend组件， 使用 object配置请参考 [std/control/Legend]{@link Legend}
   * @param {boolean|object} [options.overlay=false] 是否加载默认 overlay组件， 使用 object配置请参考 [std/control/Overlays]{@link Overlays}
   * @param {boolean|object} [options.scrollmsg=false] 是否加载默认 scrollmsg组件, 使用 object配置请参考 [std/control/ScrollMsg]{@link ScrollMsg}
   * @param {boolean|object} [options.measure=false] 是否加载默认 measure组件, 使用 object配置请参考 [std/control/Measure]{@link Measure}
   * @param {boolean|object} [options.draw=false] 是否加载默认 draw组件, 使用 object配置请参考 [std/control/Draw]{@link Draw}
   * @param {boolean|object} [options.locate=false] 是否加载默认 locate组件, 使用 object配置请参考 [std/control/Locate]{@link Locate}
   * @param {boolean|object} [options.coordpicker=false] 是否加载默认 coordpicker组件, 使用 object配置请参考 [std/control/CoordPicker]{@link CoordPicker}
   * @param {integer} [options.notifyLimit=5] 信息提示数量限制
   */
  constructor(divId, options) {
    super(divId, options)
    const canvas = document.createElement('canvas')
    this.useWebGl = undefined !==
      (canvas.getContext('experimental-webgl', { antialias: true }) ||
      canvas.getContext('webgl', { antialias: true }))

    // 此行代码用来模拟低性能模式
    // this.useWebGl = false

    if (!this.useWebGl) {
      console.warn('warning, map build on low performance mode')
    }

    this.mapEl = document.getElementById(divId)
    this.options = Object.assign({}, {
      /*
        leaflet 默认参数
       */
      attributionControl: false,
      zoomControl: false,
      contextmenu: false,
      /*
        地图默认参数
       */
      tilelayer: false,
      scalecontrol: false,
      zoomcontrol: false,
      toolbar: false,
      baselayer: false,
      legend: false,
      overlay: false,
      scrollmsg: false,
      measure: false,
      draw: false,
      locate: false,
      coordpicker: false,
      notifyLimit: 5
    }, options)
  }
  /**
   * 根据配置参数初始化地图组件
   */
  create() {
    // 地图默认配置
    // toolbar
    const defaultToolbarCfg = {
      items: [
        {
          type: 'button',
          title: locales.toolbar.layers,
          text: locales.toolbar.layers,
          toggle: true,
          iconCls: 'fm-icon-toolbar-layer',
          onclick: function(button, pressed) {
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
        '|',
        {
          type: 'button',
          title: locales.toolbar.tiles,
          text: locales.toolbar.tiles,
          iconCls: 'fm-icon-toolbar-map',
          toggle: true,
          onclick: function(button, pressed) {
            if (this.mapWrapper.controls['layers']) {
              this.mapWrapper.controls['layers'].setVisible(pressed)
              this.mapWrapper.controls['layers'].trigger = button
            }
          }
        },
        '|',
        {
          type: 'button',
          title: locales.toolbar.toolkits,
          text: locales.toolbar.toolkits,
          iconCls: 'fm-icon-toolbar-toolkit',
          onclick: function() {
          },
          menu: [
            {
              type: 'button',
              title: locales.toolbar.legend,
              text: locales.toolbar.legend,
              iconCls: 'fm-icon-toolbar-legend',
              onclick: function(clickedItem) {
                this.mapWrapper.controls.legend.setVisible(clickedItem.checked)
                if (clickedItem.checked) {
                  this.mapWrapper.controls.legend.once('hide', function() {
                    clickedItem.setChecked(false)
                  })
                }
              }
            },
            {
              type: 'button',
              title: locales.toolbar.measure,
              text: locales.toolbar.measure,
              iconCls: 'fm-icon-toolbar-measure',
              onclick: function(clickedItem) {
                if (clickedItem.checked) {
                  this.mapWrapper.controls.measure.show()
                  this.mapWrapper.controls.measure.once('hide', function() {
                    clickedItem.setChecked(false)
                  })
                } else {
                  this.mapWrapper.controls.measure.hide()
                }
              }
            },
            {
              type: 'button',
              title: locales.toolbar.draw,
              text: locales.toolbar.draw,
              iconCls: 'fm-icon-toolbar-draw',
              onclick: function(clickedItem) {
                if (clickedItem.checked) {
                  this.mapWrapper.controls.draw.show()
                } else {
                  this.mapWrapper.controls.draw.hide()
                }
              }
            },
            {
              type: 'button',
              title: locales.toolbar.locate,
              text: locales.toolbar.locate,
              iconCls: 'fm-icon-toolbar-locate',
              onclick: function(clickedItem) {
                this.mapWrapper.controls.locate.setVisible(clickedItem.checked)
              }
            },
            {
              type: 'button',
              title: locales.toolbar.pickup,
              text: locales.toolbar.pickup,
              iconCls: 'fm-icon-toolbar-picker',
              onclick: function(clickedItem) {
                this.mapWrapper.controls.coordPicker.setVisible(clickedItem.checked)
                if (clickedItem.checked) {
                  this.mapWrapper.controls.coordPicker.once('hide', function() {
                    clickedItem.setChecked(false)
                  })
                }
              }
            },
            {
              type: 'button',
              title: locales.toolbar.streetview,
              text: locales.toolbar.streetview,
              iconCls: 'fm-icon-toolbar-streetview',
              onclick: function(clickedItem) {
                const baseMap = this.mapWrapper.controls.layers.activated.split('.')[0]
                const mapWrapper = this.mapWrapper
                const lastActivated = mapWrapper._lastActivatedStreetView

                if (lastActivated && lastActivated.isEnabled() && clickedItem.checked === false) {
                  lastActivated.disable()
                } else {
                  switch (baseMap) {
                    case 'baidu':
                      if (!this.mapWrapper._baiduStreetMap) {
                        this.mapWrapper._baiduStreetMap = this.mapWrapper.createBaiduStreet()
                        this.mapWrapper._baiduStreetMap.on('hide', function() {
                          clickedItem.setChecked(false)
                        })

                        // baselayerchange callback
                        this.mapWrapper.on('baselayerchange', function(e) {
                          const layer = e.layer
                          if (!layer.options.tile.startsWith('baidu')) {
                            if (mapWrapper._lastActivatedStreetView === mapWrapper._baiduStreetMap &&
                          mapWrapper._lastActivatedStreetView.isEnabled()) {
                              mapWrapper._lastActivatedStreetView.disable()
                              clickedItem.setChecked(false)
                            }
                          } else if (mapWrapper._lastActivatedStreetView === mapWrapper._baiduStreetMap &&
                        mapWrapper._lastActivatedStreetView.isEnabled()) {
                            mapWrapper._lastActivatedStreetView.reloadTile()
                          }
                        })
                      }
                      this.mapWrapper._baiduStreetMap.enable()
                      this.mapWrapper._lastActivatedStreetView = this.mapWrapper._baiduStreetMap
                      break
                    case 'google':
                      if (!this.mapWrapper._googleStreetMap) {
                        this.mapWrapper._googleStreetMap = this.mapWrapper.createGoogleStreet()
                        this.mapWrapper._googleStreetMap.on('hide', function() {
                          clickedItem.setChecked(false)
                        })
                        // baselayerchange callback
                        this.mapWrapper.on('baselayerchange', function(e) {
                          const layer = e.layer
                          if (!layer.options.tile.startsWith('google')) {
                            if (mapWrapper._lastActivatedStreetView === mapWrapper._googleStreetMap &&
                          mapWrapper._lastActivatedStreetView.isEnabled()) {
                              mapWrapper._lastActivatedStreetView.disable()
                              clickedItem.setChecked(false)
                            }
                          } else if (mapWrapper._lastActivatedStreetView === mapWrapper._googleStreetMap &&
                        mapWrapper._lastActivatedStreetView.isEnabled()) {
                            mapWrapper._lastActivatedStreetView.reloadTile()
                          }
                        })
                      }
                      this.mapWrapper._googleStreetMap.enable()
                      this.mapWrapper._lastActivatedStreetView = this.mapWrapper._googleStreetMap
                      break
                    default:
                      console.warn('Street View only supported by Baidu and Google map!')
                      clickedItem.setChecked(false)
                      return
                  }
                }
              }
            }
          ]
        }
      ]
    }

    const defaultLegendCfg = {
      bodyStyle: {
        maxHeight: '300px',
        minWidth: '200px',
        minHeight: '50px'
      }
    }

    const defaultOverlaysCfg = {
      visible: false,
      position: 'topleft',
      bodyStyle: {
        minWidth: '300px',
        minHeight: '50px'
      },
      header: {
        iconCls: 'fm-icon-layer',
        title: locales.toolbar.layers
      },
      nodeData: []
    }

    const defaultScaleCfg = {
      position: 'bottomright'
    }

    const defaultZoomCfg = {
      position: 'bottomleft'
    }

    const defaultContextMenuCfg = {}

    const defaultDrawCfg = {
      position: 'topright',
      visible: false,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true
    }

    const defaultMeasureCfg = {
      position: 'topright',
      visible: false
    }

    const defaultLocateCfg = {
      position: 'topleft',
      visible: false
    }

    const defaultCoordPickerCfg = {
      position: 'topright',
      visible: false
    }

    const me = this
    if (typeof me.options.scalecontrol === 'object' || me.options.scalecontrol === true) {
      if (me.options.scalecontrol === true) {
        me.createScale(defaultScaleCfg)
      } else {
        me.createScale(me.options.scalecontrol)
      }
    }
    if (typeof me.options.zoomcontrol === 'object' || me.options.zoomcontrol === true) {
      if (me.options.zoomcontrol === true) {
        me.createZoom(defaultZoomCfg)
      } else {
        me.createZoom(me.options.zoomcontrol)
      }
    }
    if (typeof me.options.contextmenu === 'object' || me.options.contextmenu === true) {
      if (me.options.contextmenu === true) {
        me.createContextMenu(defaultContextMenuCfg)
      } else {
        me.createContextMenu(me.options.contextmenu)
      }
    }
    if (typeof me.options.tilelayer === 'object' || me.options.tilelayer === true) {
      if (me.options.tilelayer === true) {
        me.createTileLayer()
      } else {
        me.createTileLayer(me.options.tilelayer)
      }
    }
    if (typeof me.options.toolbar === 'object' || me.options.toolbar === true) {
      if (me.options.toolbar === true) {
        me.createToolbar(defaultToolbarCfg)
      } else {
        me.createToolbar(me.options.toolbar)
      }
    }
    if (typeof me.options.baselayer === 'object' || me.options.baselayer === true) {
      if (me.options.baselayer === true) {
        me.createBaseLayers()
      } else {
        me.createBaseLayers(me.options.baselayer)
      }
    }
    if (typeof me.options.legend === 'object' || me.options.legend === true) {
      if (me.options.legend === true) {
        me.createLegend(defaultLegendCfg)
      } else {
        me.createLegend(me.options.legend)
      }
    }
    if (typeof me.options.overlay === 'object' || me.options.overlay === true) {
      if (me.options.overlay === true) {
        me.createOverlays(defaultOverlaysCfg)
      } else {
        me.createOverlays(me.options.overlay)
      }
    }
    if (typeof me.options.scrollmsg === 'object' || me.options.scrollmsg === true) {
      if (me.options.scrollmsg === true) {
        me.createScrollMsg()
      } else {
        me.createScrollMsg(me.options.scrollmsg)
      }
    }
    if (typeof me.options.measure === 'object' || me.options.measure === true) {
      if (me.options.measure === true) {
        me.createMeasure(defaultMeasureCfg)
      } else {
        me.createMeasure(me.options.measure)
      }
    }
    if (typeof me.options.draw === 'object' || me.options.draw === true) {
      if (me.options.draw === true) {
        me.createDraw(defaultDrawCfg)
      } else {
        me.createDraw(me.options.draw)
      }
    }
    if (typeof me.options.locate === 'object' || me.options.locate === true) {
      if (me.options.locate === true) {
        me.createLocate(defaultLocateCfg)
      } else {
        me.createLocate(me.options.locate)
      }
    }
    if (typeof me.options.coordpicker === 'object' || me.options.coordpicker === true) {
      if (me.options.coordpicker === true) {
        me.createCoordPicker(defaultCoordPickerCfg)
      } else {
        me.createCoordPicker(me.options.coordpicker)
      }
    }
  }
  /**
   * 创建Scale组件
   * @param {object} [opts]
   * @param {string} [opts.position=bottomleft] 配置组件dock 位置， ['topleft'|'topright'|'bottomleft'|'bottomright']
   * @returns {ScaleControl} Leaflet scale组件, 熟悉Leaflet的可以自行查询
   */
  createScale(opts) {
    // 创建 scale 控件, 一般地图都有标准控件，目前未封装
  }
  createContextMenu(opts) {
    // 创建 地图 的 context menu 控件, 一般地图都有标准控件，目前未封装
  }
  /**
   * 创建Zoom组件
   * @param {object} [opts]
   * @param {string} [opts.position=topleft] 配置组件dock 位置， ['topleft'|'topright'|'bottomleft'|'bottomright']
   * @returns {ZoomControl} Leaflet zoom组件, 熟悉Leaflet的可以自行查询
   */
  createZoom(opts) {
    // 创建 zoom 控件, 一般地图都有标准控件，目前未封装
  }
  createTileLayer(opts) {
    // 创建 tile layer 控件
  }
  /**
   * 创建toolbar 组件
   * @param {object} [opts] 请参考 [std/control/Toolbar]{@link Toolbar} 配置
   * @returns {ToolbarControl} 返回创建的 [std/control/Toolbar]{@link Toolbar}
   */
  createToolbar(opts) {
    // 创建 toolbar 控件
  }
  /**
   * 创建 base layers 组件
   * @param {object} [opts] 请参考 [std/control/Layers]{@link Layers} 配置
   * @returns {LayersControl} 返回创建的 [std/control/Layers]{@link Layers}
   */
  createBaseLayers(opts) {
    // 创建 base layer 控件
  }
  /**
   * 创建 draw 组件
   * @param {object} [opts] 请参考 [std/control/Draw]{@link Draw} 配置
   * @returns {DrawControl} 返回创建的 [std/control/Draw]{@link Draw}
   */
  createDraw(opts) {
    // 创建 draw 控件
  }
  /**
   * 创建 measure 组件
   * @param {object} [opts] 请参考 [std/control/Measure]{@link Measure} 配置
   * @returns {MeasureControl} 返回创建的 [std/control/Measure]{@link Measure}
   */
  createMeasure(opts) {
    // 创建 measure 控件
  }
  /**
   * 创建 locate 组件
   * @param {object} [opts] 请参考 [std/control/Locate]{@link Locate} 配置
   * @returns {LocateControl} 返回创建的 [std/control/Locate]{@link Locate}
   */
  createLocate(opts) {
    // 创建 locate 控件
  }
  /**
   * 创建 coord picker 组件
   * @param {object} [opts] 请参考 [std/control/CoordPicker]{@link CoordPicker} 配置
   * @returns {CoordPickerControl} 返回创建的 [std/control/CoordPicker]{@link CoordPicker}
   */
  createCoordPicker(opts) {
    // 创建 coorPicker 控件
  }
  /**
   * 创建 panel 组件
   * @param {object} [opts] 请参考 [std/control/Panel]{@link Panel} 配置
   * @returns {PanelControl} 返回创建的 [std/control/Panel]{@link Panel}
   */
  createPanel(opts) {
    // 创建 panel 控件
  }
  /**
   * 创建 overlays 组件
   * @param {object} [opts] 请参考 [std/control/Overlays]{@link Overlays} 配置
   * @returns {OverlaysControl} 返回创建的 [std/control/Overlays]{@link Overlays}
   */
  createOverlays(opts, type) {
    // 创建 overlays 控件
  }
  /**
   * 创建 scroll msg 组件
   * @param {object} [opts] 请参考 [std/control/ScrollMsg]{@link ScrollMsg} 配置
   * @returns {ScrollMsgControl} 返回创建的 [std/control/ScrollMsg]{@link ScrollMsg}
   */
  createScrollMsg(opts) {
    // 创建 scroll msg 控件
  }
  /**
   * 创建 canvas 数据渲染 组件入口 <br />
   * 当浏览器支持 webgl时，point/grid默认创建 webgl 组件 <br />
   * 当webgl组件大于 {@link MapWrapper#webGlLimit} 时，创建 canvas2d 画法组件 <br />
   * link/cell/icon均为 canvas2d 组件
   *
   * @param {object} [opts] 请参考 对应的Canvas配置: <br /> <string>point</string>-[std/layers/overlay/WebglPointOverlay]{@link WebglPointOverlay}, [std/layers/overlay/PointOverlay]{@link PointOverlay} <br />
   * <string>grid</string>-[std/layers/overlay/WebglGridOverlay]{@link WebglGridOverlay}, [std/layers/overlay/GridOverlay]{@link GridOverlay} <br />
   * <string>link</string>-[std/layers/overlay/LinkOverlay]{@link LinkOverlay} <br />
   * <string>cell</string>-[std/layers/overlay/CellOverlay]{@link CellOverlay} <br />
   * <string>icon</string>-[std/layers/overlay/IconOverlay]{@link IconOverlay} <br />
   * <string>line</string>-[std/layers/overlay/WebglLineOverlay]{@link WebglLineOverlay}
   * @param {string} [type=point] 支持以下类型： point-点， grid-栅格， link-连线, cell-扇区, icon-图标, line-绘线
   * @returns {CanvasOverlay} 根据 type 参数返回创建的 overlay
   */
  createCanvas(opts, type) {
    type = type || 'point'
    const numOfWebGl = this.getWebGlLayers().length
    switch (type) {
      case 'point':
        if (this.useWebGl) {
          if (numOfWebGl < this.webGlLimit) {
            return this.createWebGlPointOverlay(opts)
          }
          console.warn('webgl context reach limited of browser, use Low Mode instead!')
        }
        return this.createPointOverlay(opts)
      case 'grid':
        if (this.useWebGl) {
          if (numOfWebGl < this.webGlLimit) {
            return this.createWebGlGridOverlay(opts)
          }
          console.warn('webgl context reach limited of browser, use Low Mode instead!')
        }
        return this.createGridOverlay(opts)
      case 'link':
        return this.createLinkOverlay(opts)
      case 'line':
        return this.createLineOverlay(opts)
      case 'cell':
        return this.createCellOverlay(opts)
      case 'icon':
        return this.createIconOverlay(opts)
      default:
        throw new Error('Canvas type not supported!')
    }
  }
  createWebGlPointOverlay(opts) {
    // WebGlPointOverlay
  }
  createPointOverlay(opts) {
    // PointOverlay
  }
  createWebGlGridOverlay(opts) {
    // WebGlGridOverlay
  }
  createGridOverlay(opts) {
    // GridOverlay
  }
  createCellOverlay(opts) {
    // cell overlay
  }
  createLineOverlay(opts) {
    // line overlay
  }
  createLegend(opts) {
    // 创建 scroll msg 控件
  }
  createHeatmap(opts) {
    // 创建 heatmap overlay 控件
  }
  createLinkOverlay(opts) {
    // 创建 link overlay 控件
  }
  createIconOverlay(opts) {
    // 创建 icon overlay 控件
  }
  /**
   * 创建 baidu street 组件, 需要引入 百度地图 api
   * @param {object} [opts] 请参考 [std/control/BaiduStreet]{@link BaiduStreet} 配置
   * @returns {BaiduStreetControl} 返回创建的 [std/control/BaiduStreet]{@link BaiduStreet}
   */
  createBaiduStreet(opts) {
    // 创建 baidu street 控件
  }
  /**
   * 创建 google street 组件, 需要引入 谷歌地图 api
   * @param {object} [opts] 请参考 [std/control/GoogleStreet]{@link GoogleStreet} 配置
   * @returns {GoogleStreetControl} 返回创建的 [std/control/GoogleStreet]{@link GoogleStreet}
   */
  createGoogleStreet(opts) {
    // 创建 google street 控件
  }
  /**
   * 移除组件
   * @param {control} ctrl 将要从地图中移除的 control
   */
  removeControl(ctrl) {
    // 移除 control
  }
  /**
   * 获取当前地图的 zoom级别到 max zoom的差值，例如当前地图最大zoom级别为18， 当前浏览级别是12， 则返回 18 - 12 = 6
   * @returns {integer} 到最大zoom级别的差值
   */
  getZoomDistanceToMax() {
    // 获取当前级别到最大级别的差值，通常用于组件缩放
    return this.getMaxZoom() - this.getZoom()
  }
  /**
   * 获取地图的最大放大级别
   * @returns {integer} 地图最大放大级别
   */
  getMaxZoom() {
    // 获取地图的最大 zoom
  }
  /**
   * 获取地图的最小缩小级别
   * @returns {integer} 地图的最小缩小级别
   */
  getMinZoom() {
    // 获取地图的最小 zoom
  }
  /**
   * 获取当前浏览的缩放级别
   * @returns {integer} 当前浏览的缩放级别
   */
  getZoom() {
    // 获取地图的 zoom
  }
  /**
   * 地图缩放级别缩小一级
   */
  zoomIn() {
    // 地图的 zoomIn
  }
  /**
   * 地图缩放级别放大一级
   */
  zoomOut() {
    // 地图的 zoomOut
  }

  /**
   * 获得当前底图的CRS CODE
   * @returns {CRSCode}
   */
  getCrsCode() {}
  /**
   * 设置地图可视区域
   * @param {LatLng} center 中心点坐标, 例： {lat: 23.331122, lng: 113.927721}
   * @param {integer} zoom 地图缩放级别
   */
  setView(center, zoom) {
    // 设置地图的 latlng与zoom级别
  }
  /**
   * 根据给定的边界设置地图视图
   * @param {Bounds} bounds 边界值，例：{north: 31.870605, south: 30.675085, west: 120.861083, east: 122.012911}
   */
  fitBounds(bounds) {}

  /**
   * 加载瓦片图层
   * @param {TileLayer} tileLayer
   */
  addTileLayer(tileLayer) {}
  /**
   * 移除瓦片图层
   * @param {TileLayer} tileLayer
   */
  removeTileLayer(tileLayer) {}
  /**
   * 移除地图
   */
  remove() {
    // 地图移除
    Object.values(this.layers).forEach(function(layer) {
      layer.onRemove()
    })
  }
  beforeLayerAdd(layer) {
    if (layer.options.isLayer) {
      this.layers[DomUtil.stamp(layer)] = layer
    }
    return this
  }
  beforeLayerRemove(layer) {
    if (layer.options.isLayer) {
      delete this.layers[DomUtil.stamp(layer)]
    }
  }
  /**
   * 获取当前地图上所有可点击的 layer
   * @returns {layer[]} 可点击的layer数组
   */
  getClickableLayers() {
    return Object.values(this.layers).filter(function(layer) {
      return layer.options.clickable
    })
  }
  /**
   * 获取当前地图上所有采用 webgl 渲染的 layer
   * @returns {layer[]} 采用 webgl 渲染的 layer数组
   */
  getWebGlLayers() {
    return Object.values(this.layers).filter(function(layer) {
      return layer.useWebGL
    })
  }
  _onMapMoveStart(e) {
    this.moving = true
  }
  _onMapMoveEnd(e) {
    this.moving = false
  }
  _onBaselayerChange(e) {

  }
  _onCrschange(e) {

  }
  lastMoveTrigger = 0
  moveEventInterval = 40
  onMapMouseMove(e) {
    if (this.grabing) {
      return
    }
    if (this.moving || Date.now() - this.lastMoveTrigger < this.moveEventInterval) {
      return
    }
    this.lastMoveTrigger = Date.now()
    if (Object.values(this.getClickableLayers()).some(function(layer) {
      if (layer.isImpact(e.latlng, e.point)) {
        return true
      }
    })) {
      DomUtil.addClass(this.mapEl, 'fm-clickable')
    } else {
      DomUtil.removeClass(this.mapEl, 'fm-clickable')
    }
  }
  onMapClick(e) {
    if (this.grabing) {
      this.grabingHandler.callback.call(this.grabingHandler.scope, e)
      return
    }
    Object.values(this.getClickableLayers()).some(function(layer) {
      return layer._onMapClick(e.latlng, e.point)
    })
  }
  /**
   * @callback MapWrapper#mapGrabingCallBack
   * @param {object} e
   * @param {LatLng} e.latlng 返回点击地图的经纬度，格式： {lat: 23.221, lng: 113.5544}
   * @param {Pixel} e.point 返回点击地图组件的xy像素，格式： {x: 552, y: 331}
   * @param {string} e.type 事件类型
   * @param {object} e.target 触发事件的源
   * @param {object} e.originalEvent HTML原始事件
   */
  /**
   * 绑架地图 mousemove 和 click, 绑架后map上的 mouse move失效，click会被劫持
   * @param {MapWrapper#mapGrabingCallBack} callback 点击地图后调用的方法，传递鼠标点击事件
   * @param {ref} scope=MapWrapper callback方法中 this的作用域
   */
  grabClickEvent(callback, scope) {
    var me = this
    me.grabing = true
    me.grabingHandler = {
      callback: callback,
      scope: scope || me
    }
  }
  /**
   * 释放地图的的 mousemove 和 click 被绑架状态
   */
  releaseGrabbed() {
    this.grabing = false
  }
  /**
   * 添加标记到地图
   * @param {LatLng} latLng 标记的坐标，例： {lat: 23.331122, lng: 113.927721}
   * @param {object} [opts]
   * @param {CRSCode} [opts.crsCode] 默认使用系统配置
   * @returns {Marker} 返回添加的标记，调用对象的remove方法可将标记从地图移除
   */
  addMarker(latLng, opts) {

  }
  /**
   * 添加一个信息提示到地图
   * @param {object|string} opts 信息提示选项或信息文本
   * @param {string} [opts.type=info] 信息提示类型， 可选值：info，loading，success，error，warning
   * @param {string} [opts.title] 信息提示的标题
   * @param {string} [opts.content] 信息提示内容
   * @param {number} [opts.timeOut=0] 自动移除时间，设置为0不移除，单位：ms
   * @param {Position} [opts.position=bottomright] 信息提示的位置
   * @returns {object} 返回信息提示对象，其中el为信息框的网页元素对象，调用destory方法进行移除
   */
  notify(opts) {
    const me = this

    // toastr 参数
    const defaultOpts = {
      hideDuration: 300,
      extendedTimeOut: 1,
      tapToDismiss: false,
      target: this.mapEl
    }
    // 位置映射
    const positionMapping = {
      topleft: 'toast-top-left',
      topright: 'toast-top-right',
      bottomleft: 'toast-bottom-left',
      bottomright: 'toast-bottom-right'
    }
    // 提取与覆盖默认参数
    let type = 'info'
    let title, content
    let position = 'bottomright'
    let timeOut = 0
    if (typeof opts === 'object') {
      if (opts.type) type = opts.type
      title = opts.title
      content = opts.content
      if (opts.position) position = opts.position
      if (opts.timeOut) timeOut = opts.timeOut
    } else {
      content = opts
    }
    const options = Object.assign({}, defaultOpts, {
      timeOut: timeOut,
      positionClass: positionMapping[position]
    })

    let notification
    if (type === 'success') {
      notification = _$.fn.toastr.success(content, title, options)
    } else if (type === 'info') {
      notification = _$.fn.toastr.info(content, title, options)
    } else if (type === 'warning') {
      notification = _$.fn.toastr.warning(content, title, options)
    } else if (type === 'error') {
      notification = _$.fn.toastr.error(content, title, options)
    } else if (type === 'loading') {
      notification = _$.fn.toastr.loading(content, title, options)
    } else {
      notification = _$.fn.toastr.info(content, title, options)
    }
    // 注册销毁方法
    notification.destory = function() {
      if (me._notifications.indexOf(notification) >= 0) {
        me._notifications.splice(me._notifications.indexOf(notification), 1)
        notification._ux_remove()
      }
    }
    // 超过限定数量时移除第一个
    if (this._notifications.length === this.options.notifyLimit) {
      this._notifications[0].destory()
    }

    this._notifications.push(notification)
    return notification
  }
}

export default MapWrapper
