import Vue from 'vue'
import echarts from 'echarts'
import * as d3 from 'd3'
import DataUtil from './util/data-util'
import BaseStore from './store/base-store'

// 可根据框架选择对应的包装版本
import LeafletWrapper from '../fleet-leaflet/leaflet2fleetmap'
// 可根据框架选择对应的包装版本
export const FLEET_MAP_ENGINE_LEAFLET = 'leaflet'

window.nodeData = [
  { name: 'GridParam_LTE_DM_201909', open: true, removeEnable: true, rangeEnable: false, checked: false,
    children: [
      { name: 'DRIVE_ITATIBA_0206-105431931_0305104556', icon: 'icons/map/layers-icon.png', removeEnable: true, rangeEnable: true, checked: false, traceId: 'DRIVE_ITATIBA_0206-105431931_0305104556', dataId: 'DRIVE_ITATIBA_0206-105431931_0305104556.json' },
      { name: '20190901_52W', icon: 'icons/map/layers-icon.png', removeEnable: true, rangeEnable: true, checked: false, traceId: '20190901_52W', dataId: '20190901_52W.json' },
      { name: '20190902_65W', icon: 'icons/map/layers-icon.png', removeEnable: true, rangeEnable: true, checked: false, traceId: '20190902_65W', dataId: '20190902_65W.json' },
      { name: '20190903_80W', icon: 'icons/map/layers-icon.png', removeEnable: true, rangeEnable: true, checked: false, traceId: '20190903_80W', dataId: '20190903_80W.json' },
      { name: '20190904_100W', icon: 'icons/map/layers-icon.png', removeEnable: true, rangeEnable: true, checked: false, traceId: '20190904_100W', dataId: '20190904_100W.json' },
      { name: '20190905_27W', icon: 'icons/map/layers-icon.png', removeEnable: true, rangeEnable: true, checked: false, traceId: '20190905_27W', dataId: '20190905_27W.json' }
      // { name: '(-105,-100]', icon: 'icons/map/layers-icon.png', rangeEnable: true, checked: true, traceId: 'demo1', legendKey: '(-105,-100]' },
      // { name: '(-100,-95]', icon: 'icons/map/layers-icon.png', rangeEnable: true, checked: true, traceId: 'demo1', legendKey: '(-100,-95]' },
      // { name: '(-95,-85]', icon: 'icons/map/layers-icon.png', rangeEnable: true, checked: true, traceId: 'demo1', legendKey: '(-95,-85]' },
      // { name: '(-85,-75]', icon: 'icons/map/layers-icon.png', rangeEnable: true, checked: true, traceId: 'demo1', legendKey: '(-85,-75]' },
      // { name: '>-75', icon: 'icons/map/layers-icon.png', rangeEnable: true, checked: true, traceId: 'demo1', legendKey: '>-75' }
    ]
  },
  // { name: 'WebGL栅格层示例', open: true, checked: true,
  //   children: [
  //     { name: '<=-110', icon: 'icons/map/layers-icon.png', rangeEnable: true, rangeValue: 70, checked: true, traceId: 'demo2', legendKey: '<=-110' },
  //     { name: '(-110,-105]', icon: 'icons/map/layers-icon.png', rangeEnable: true, rangeValue: 70, checked: true, traceId: 'demo2', legendKey: '(-110,-105]' },
  //     { name: '(-105,-100]', icon: 'icons/map/layers-icon.png', rangeEnable: true, rangeValue: 70, checked: true, traceId: 'demo2', legendKey: '(-105,-100]' },
  //     { name: '(-100,-95]', icon: 'icons/map/layers-icon.png', rangeEnable: true, rangeValue: 70, checked: true, traceId: 'demo2', legendKey: '(-100,-95]' },
  //     { name: '(-95,-85]', icon: 'icons/map/layers-icon.png', rangeEnable: true, rangeValue: 70, checked: true, traceId: 'demo2', legendKey: '(-95,-85]' },
  //     { name: '(-85,-75]', icon: 'icons/map/layers-icon.png', rangeEnable: true, rangeValue: 70, checked: true, traceId: 'demo2', legendKey: '(-85,-75]' },
  //     { name: '>-75', icon: 'icons/map/layers-icon.png', rangeEnable: true, rangeValue: 70, checked: true, traceId: 'demo2', legendKey: '>-75' }
  //   ]
  // },
  { name: '扇区层示例', icon: 'icons/map/layers-icon.png', checked: false, rangeEnable: true, traceId: 'demo_cell' },
  { name: '扇区密集程度示例(热力图)', icon: 'icons/map/layers-icon.png', checked: false, rangeEnable: true, traceId: 'demo_heatmap' }
]

const overlaysCfg = {
  visible: false,
  position: 'topleft',
  header: {
    icon: 'icons/map/layer_icon2.svg',
    title: locales.toolbar.layers
  },
  beforeRemoveHook: function(treeId, treeNode) {
    return confirm(`确认删除 节点 -- ${JSON.stringify(treeNode)} 吗？`)
  },
  nodeData: window.nodeData
}

export default class FleetMap {
  dataLayers = {}
  toolbarCfg = {
    items: [
      {
        type: 'button',
        title: locales.toolbar.layers,
        text: locales.toolbar.layers,
        toggle: true,
        icon: 'icons/map/toolbar_layers.png',
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
        icon: 'icons/map/toolbar_maps.png',
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
        icon: 'icons/map/toolbar_toolkits.png',
        onclick: function() {
        },
        menu: [
          {
            type: 'button',
            title: locales.toolbar.legend,
            text: locales.toolbar.legend,
            icon: 'icons/map/legend.svg',
            onclick: function(clickedItem) {
              this.mapWrapper.controls.legend.setVisible(clickedItem.checked)
              if (clickedItem.checked) {
                this.mapWrapper.controls.legend.once('hide', function() {
                  window.clickedItem = clickedItem
                  clickedItem.setChecked(false)
                })
              }
            }
          },
          {
            type: 'button',
            title: locales.toolbar.measure,
            text: locales.toolbar.measure,
            icon: 'icons/map/ruler.svg',
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
            icon: 'icons/map/draw.svg',
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
            icon: 'icons/map/locate.svg',
            onclick: function(clickedItem) {
              this.mapWrapper.controls.locate.setVisible(clickedItem.checked)
            }
          },
          {
            type: 'button',
            title: locales.toolbar.pickup,
            text: locales.toolbar.pickup,
            icon: 'icons/map/picker.svg',
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
            title: locales.toolbar.direction,
            text: locales.toolbar.direction,
            icon: 'icons/map/tile.svg',
            onclick: function(clickedItem) {
              // this.mapWrapper.controls.scrollmsg.addMsg(`您点击了<strong>[测试方向]</strong>`)
              if (window.drive && window.directionStore && !window.drive.store) {
                window.drive.bindStore(window.directionStore)
              }
              window.drive.setVisible(clickedItem.checked)
            }
          },
          {
            type: 'button',
            title: locales.toolbar.cell_coverage,
            text: locales.toolbar.cell_coverage,
            icon: 'icons/map/tile.svg',
            onclick: function(clickedItem) {
              this.mapWrapper.controls.scrollmsg.addMsg(`您点击了<strong>[小区覆盖]</strong>`)
            }
          },
          {
            type: 'button',
            title: locales.toolbar.cell_search,
            text: locales.toolbar.cell_search,
            icon: 'icons/map/tile.svg',
            onclick: function(clickedItem) {
              this.mapWrapper.controls.scrollmsg.addMsg(`您点击了<strong>[查找小区]</strong>`)
            }
          },
          {
            type: 'button',
            title: locales.toolbar.charts,
            text: locales.toolbar.charts,
            icon: 'icons/map/chart.svg',
            onclick: function(clickedItem) {
              this.mapWrapper.echartPanel.setVisible(clickedItem.checked)
              if (clickedItem.checked) {
                this.mapWrapper.echartPanel.once('hide', function() {
                  clickedItem.setChecked(false)
                })
              }
            }
          },
          {
            type: 'button',
            title: locales.toolbar.streetview,
            text: locales.toolbar.streetview,
            icon: 'icons/map/streetview.png',
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
                    Vue.prototype.$message({
                      message: 'Street View only supported by Baidu and Google map!',
                      type: 'error',
                      duration: 1500
                    })
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
  constructor(divId, mapOptions) {
    const op = this.options = Object.assign({}, {
      /*
       默认配置
       */
      engine: 'leaflet',
      overlay: false
    }, mapOptions)

    var me = this
    const wrapper = this.getMapWrapper(divId, op)
    wrapper.create()

    // 示例代码 - start

    wrapper.createZoom({
      position: 'bottomleft'
    })
    wrapper.createScale({
      position: 'bottomright'
    })
    // wrapper.createTileLayer()
    wrapper.createToolbar(this.toolbarCfg)
    wrapper.createBaseLayers()
    wrapper.createLegend({ bodyStyle: { maxHeight: '300px' }})
    const overlays = wrapper.createOverlays(DataUtil.deepClone({}, overlaysCfg))

    overlays.on('itemremove', function(e) {
      this.mapWrapper.controls.scrollmsg.addMsg(`已删除节点[<strong>${JSON.stringify(e.node)}</strong>]`)
    })

    overlays.on('layerchanged', function(e) {
      if (e.node.traceId) {
        const layer = me.dataLayers[e.node.traceId]
        if (layer) {
          layer.setVisible(e.value, e.node.legendKey)

          if (e.node.traceId === 'demo_heatmap') {
            const heatLayer = me.dataLayers[e.node.traceId]
            heatLayer.legend.setVisible(e.value)
          }
        } else {
          let demo
          switch (e.node.traceId) {
            case 'demo_cell':
              demo = wrapper.createCellOverlay({
                directionKey: '天线方位角（度）',
                labelOffset: 0,
                labelFields: ['基站名称', '小区标识', '物理小区PCI']
              })

              me.dataLayers[e.node.traceId] = demo
              _$.ajax('./fake/上海LTE基站.json',
                {
                  success: function(data, status, jqXHR) {
                    for (let i = 1; i < data.length; i++) {
                      data[i][14] = parseFloat(data[i][14])
                      data[i][15] = parseFloat(data[i][15])
                      data[i][16] = parseFloat(data[i][16])

                      if (isNaN(data[i][15]) || isNaN(data[i][16])) {
                        console.log('err data', data[i])
                      }
                    }

                    demo.setData(data, {
                      latKey: '扇区纬度',
                      lngKey: '扇区经度',
                      crsCode: 'WGS84'
                    })
                  }
                })
              break
            case 'demo_heatmap':
              demo = wrapper.createHeatmap()
              me.dataLayers[e.node.traceId] = demo

              _$.ajax('./fake/上海LTE基站.json',
                {
                  success: function(data, status, jqXHR) {
                    for (let i = 1; i < data.length; i++) {
                      data[i][14] = parseFloat(data[i][14])
                      data[i][15] = parseFloat(data[i][15])
                      data[i][16] = parseFloat(data[i][16])
                      if (isNaN(data[i][15]) || isNaN(data[i][16])) {
                        console.log('err data', data[i])
                      }
                    }

                    demo.setData(data, {
                      latKey: '扇区纬度',
                      lngKey: '扇区经度',
                      crsCode: 'WGS84'
                    })

                    const gradient = demo.legend = wrapper.createPanel({
                      position: 'bottomleft',
                      visible: false,
                      closeButton: false,
                      bodyStyle: {
                        width: '300px',
                        height: '60px'
                      },
                      header: {
                        title: '热力图图例'
                      }
                    })

                    const gradientBody = d3.select(gradient._bodyEl)
                    // 定义比例尺
                    const scale = d3.scaleLinear().domain([0, 10]).range([0, 260])
                    const axis = d3.axisBottom(scale)
                    const svg = gradientBody.append('svg').attr('width', 280).attr('height', 60)

                    const defs = svg.append('defs')

                    const linearGradient = defs.append('linearGradient')
                      .attr('id', 'linearColor')
                      .attr('x1', '0%')
                      .attr('x2', '100%')

                    linearGradient.append('stop')
                      .attr('offset', '25%')
                      .style('stop-color', 'blue')

                    linearGradient.append('stop')
                      .attr('offset', '55%')
                      .style('stop-color', 'green')

                    linearGradient.append('stop')
                      .attr('offset', '85%')
                      .style('stop-color', 'yellow')

                    linearGradient.append('stop')
                      .attr('offset', '100%')
                      .style('stop-color', 'red')

                    svg.append('rect')
                      .attr('transform', 'translate(10, 13)')
                      .attr('width', 260)
                      .attr('height', 15)
                      .style('fill', 'url(#' + linearGradient.attr('id') + ')')

                    svg.append('g')
                      .attr('class', 'axis')
                      .attr('transform', 'translate(10, 30)')
                      .call(axis)

                    gradient.setVisible(true)
                  }
                })
              break
            case 'DRIVE_ITATIBA_0206-105431931_0305104556':
              var colorCatagory = d3.scaleOrdinal(d3.schemeCategory10)
              var colorIdx = 0
              demo = wrapper.createCanvas({
                debug: true,
                name: e.node.traceId,
                style: {
                  color: 'green'
                },
                legends: {
                  '215': {
                    color: colorCatagory(colorIdx++)
                  },
                  '214': {
                    color: colorCatagory(colorIdx++)
                  },
                  '216': {
                    color: colorCatagory(colorIdx++)
                  },
                  '1': {
                    color: colorCatagory(colorIdx++)
                  },
                  '2': {
                    color: colorCatagory(colorIdx++)
                  },
                  '4': {
                    color: colorCatagory(colorIdx++)
                  },
                  '6': {
                    color: colorCatagory(colorIdx++)
                  },
                  '7': {
                    color: colorCatagory(colorIdx++)
                  },
                  '8': {
                    color: colorCatagory(colorIdx++)
                  },
                  '9': {
                    color: colorCatagory(colorIdx++)
                  },
                  '14': {
                    color: colorCatagory(colorIdx++)
                  },
                  '345': {
                    color: colorCatagory(colorIdx++)
                  }
                }
              })

              demo.on('itemclick', function(e) {
                const data = e.data
                this.mapWrapper.controls.scrollmsg.addMsg(`您从[<strong>${demo.options.name}</strong>]层点中了<strong>${data.length}</strong>个元素`)
                this.mapWrapper.controls.scrollmsg.addMsg(`其中第一个元素是<strong>${JSON.stringify(data[0])}</strong>`)
              }, me)

              wrapper.controls.legend.register(demo)

              wrapper.controls.scrollmsg.addMsg(`开始请求 ${e.node.traceId} 数据`)
              _$.ajax(`./fake/${e.node.dataId}`,
                {
                  success: function(data, status, jqXHR) {
                    wrapper.controls.scrollmsg.addMsg(`${e.node.traceId} 数据获取成功，开始分析...`)
                    demo.setData(data, {
                      groupKey: 'PCI',
                      latKey: 'Latitude',
                      lngKey: 'Longitude',
                      crsCode: 'WGS84'
                    })
                  }
                })
              me.dataLayers[e.node.traceId] = demo
              break
            default:
              demo = wrapper.createCanvas({
                debug: true,
                name: e.node.traceId === '500k' ? `${e.node.traceId}，并且这是一个超长的指标名称示范` : e.node.traceId,
                style: {
                  color: 'green'
                },
                legends: {
                  '<=-110': {
                    color: '#ff0000'
                  },
                  '(-110,-105]': {
                    color: '#ff00ff'
                  },
                  '(-105,-100]': {
                    color: '#ffff00'
                  },
                  '(-100,-95]': {
                    color: '#80ffff'
                  },
                  '(-95,-85]': {
                    color: '#0000ff'
                  },
                  '(-85,-75]': {
                    color: '#00ff00'
                  },
                  '>-75': {
                    color: '#008000'
                  }
                }
              })

              demo.on('itemclick', function(e) {
                const data = e.data
                this.mapWrapper.controls.scrollmsg.addMsg(`您从[<strong>${demo.options.name}</strong>]层点中了<strong>${data.length}</strong>个元素`)
                this.mapWrapper.controls.scrollmsg.addMsg(`其中第一个元素是<strong>${JSON.stringify(data[0])}</strong>`)
              }, me)

              wrapper.controls.legend.register(demo)

              wrapper.controls.scrollmsg.addMsg(`开始请求 ${e.node.traceId} 数据`)
              _$.ajax(`./fake/${e.node.dataId}`,
                {
                  success: function(data, status, jqXHR) {
                    wrapper.controls.scrollmsg.addMsg(`${e.node.traceId} 数据获取成功，开始分析...`)
                    demo.setData(data, {
                      groupKey: '区间',
                      latKey: 'BottomLeftY',
                      lngKey: 'BottomLeftX',
                      crsCode: 'WGS84'
                    })
                  }
                })
              me.dataLayers[e.node.traceId] = demo
              break
          }
        }
      }
      wrapper.controls.scrollmsg.addMsg(`<strong>${e.node.name}</strong> value : [${e.oldValue} -> ${e.value}]`)
    }).on('rangechanged', function(e) {
      if (e.node.traceId) {
        const layer = me.dataLayers[e.node.traceId]
        if (layer) {
          layer.setOpacity(e.value / 100.0)
        }
      }
      wrapper.controls.scrollmsg.addMsg(`<strong>${e.node.name}</strong> value : [${e.oldValue} -> ${e.value}]`)
    })
    wrapper.createScrollMsg()

    const iconOverlay = wrapper.createCanvas({
      name: '图标示例',
      legends: {
        '<=-110': {
          icon: './icons/call_dropped.png'
        },
        '(-110,-105]': {
          icon: './icons/call_end.png'
        },
        '(-105,-100]': {
          icon: './icons/call_setup_failure.png'
        },
        '(-100,-95]': {
          icon: './icons/call_setup.png'
        },
        '(-95,-85]': {
          icon: './icons/no_picture.png'
        },
        '(-85,-75]': {
          icon: './icons/map/a.png'
        },
        '>-75': {
        }
      }
    }, 'icon')

    iconOverlay.on('itemclick', function(e) {
      const data = e.data
      console.log(data)
      this.mapWrapper.controls.scrollmsg.addMsg(`您从[<strong>图标示例</strong>]层点中了<strong>${data.length}</strong>个元素`)
      this.mapWrapper.controls.scrollmsg.addMsg(`其中第一个元素是<strong>${JSON.stringify(data[0])}</strong>`)
    }, me)

    _$.ajax('./fake/real_data.json',
      {
        success: function(data, status, jqXHR) {
          iconOverlay.setData(data, {
            groupKey: '区间',
            latKey: 'BottomLeftY',
            lngKey: 'BottomLeftX',
            crsCode: 'WGS84'
          })
        }
      })
    wrapper.controls.legend.register(iconOverlay)

    const canvasOverlayReal = wrapper.createCanvas({
      name: 'WebGL点示例',
      offsetX: 30,
      offsetY: 30,
      style: {
        color: 'green'
      },
      legends: {
        '<=-110': {
          color: '#ff0000'
        },
        '(-110,-105]': {
          color: '#ff00ff'
        },
        '(-105,-100]': {
          color: '#ffff00'
        },
        '(-100,-95]': {
          color: '#80ffff'
        },
        '(-95,-85]': {
          color: '#0000ff'
        },
        '(-85,-75]': {
          color: '#00ff00'
        },
        '>-75': {
          color: '#008000'
        }
      }
    })

    canvasOverlayReal.on('itemclick', function(e) {
      const data = e.data
      console.log(data)
      this.mapWrapper.controls.scrollmsg.addMsg(`您从[<strong>真实数据示例（点）</strong>]层点中了<strong>${data.length}</strong>个元素`)
      this.mapWrapper.controls.scrollmsg.addMsg(`其中第一个元素是<strong>${JSON.stringify(data[0])}</strong>`)
    }, me)

    _$.ajax('./fake/real_data.json',
      {
        success: function(data, status, jqXHR) {
          canvasOverlayReal.setData(data, {
            groupKey: '区间',
            latKey: 'BottomLeftY',
            lngKey: 'BottomLeftX',
            crsCode: 'WGS84'
          })
        }
      })
    this.dataLayers['demo1'] = canvasOverlayReal
    wrapper.controls.legend.register(canvasOverlayReal)

    // const gridCanvasReal = wrapper.createCanvas({
    //   name: 'WebGL栅格示例',
    //   gridSize: 0.0005,
    //   opacity: 0.7,
    //   style: {
    //     color: 'red'
    //   },
    //   legends: {
    //     '<=-110': {
    //       color: '#ff0000'
    //     },
    //     '(-110,-105]': {
    //       color: '#ff00ff'
    //     },
    //     '(-105,-100]': {
    //       color: '#ffff00'
    //     },
    //     '(-100,-95]': {
    //       color: '#80ffff'
    //     },
    //     '(-95,-85]': {
    //       color: '#0000ff'
    //     },
    //     '(-85,-75]': {
    //       color: '#00ff00'
    //     },
    //     '>-75': {
    //       color: '#008000'
    //     }
    //   }
    // }, 'grid')
    // gridCanvasReal.on('itemclick', function(e) {
    //   const data = e.data
    //   this.mapWrapper.controls.scrollmsg.addMsg(`您从[<strong>真实数据层（栅格）</strong>]层点中了<strong>${data.length}</strong>个元素`)
    //   this.mapWrapper.controls.scrollmsg.addMsg(`元素是<strong>${JSON.stringify(data[0])}</strong>`)
    // }, me)

    // _$.ajax('./fake/real_data.json',
    //   {
    //     success: function(data, status, jqXHR) {
    //       gridCanvasReal.setData(data, {
    //         groupKey: '区间',
    //         latKey: 'BottomLeftY',
    //         lngKey: 'BottomLeftX',
    //         crsCode: 'WGS84'
    //       })
    //     }
    //   })
    // this.dataLayers['demo2'] = gridCanvasReal
    // wrapper.controls.legend.register(gridCanvasReal)

    const draw = wrapper.createDraw({
      position: 'topright',
      visible: false,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true
    })

    draw.on('show', function(e) {
      _$.ajax('./fake/hangzhou.json', {
        success: function(data, status, jqXHR) {
          draw.setGeoJSON(data)
        }
      })
    })

    wrapper.createMeasure({
      position: 'topright',
      visible: false
    })

    wrapper.createLocate({
      position: 'topleft',
      visible: false
    })

    const coordPicker = wrapper.createCoordPicker({
      position: 'topright',
      visible: false
    })

    coordPicker.on('copysuccess', function(e) {
      Vue.prototype.$message({
        message: '坐标已复制',
        type: 'success',
        duration: 1500
      })
    }, me)

    // const lineOverlay = wrapper.createCanvas(
    //   {
    //     name: '路网示例',
    //     style: {
    //       color: [79, 210, 125] // 'red'
    //     }
    //   }, 'line')

    // _$.ajax('./fake/road.json',
    //   {
    //     success: function(data, status, jqXHR) {
    //       lineOverlay.setData(data, {
    //         geojsonKey: 'RoadDefinition',
    //         groupKey: 'Level',
    //         crsCode: 'WGS84'
    //       })
    //     }
    //   })
    // me.mapWrapper.controls.legend.register(lineOverlay)
    const linkOverlay = wrapper.createLinkOverlay({ dashed: true, dashStyle: [20, 5, 10, 5, 3, 5] })
    linkOverlay.setData([
      ['lng', 'lat'],
      [116.8685727, 38.29922299],
      [120.8813471, 31.37815288],
      [120.977916, 31.35614415],
      [121.3075977, 31.05475938],
      [121.409118, 31.143544],
      [121.410466, 31.143238],
      [121.409118, 31.143544],
      [121.408668, 31.141897]
    ], { crsCode: 'WGS84' })

    const anotherOverlay = wrapper.createLinkOverlay()
    anotherOverlay.setData([
      ['lng', 'lat'],
      [121.409118, 31.143544],
      [121.410020, 31.142792],
      [121.409118, 31.143544],
      [121.410455, 31.143678],
      [121.409118, 31.143544],
      [121.409569, 31.142342]
    ], { crsCode: 'WGS84' })

    const echartPanel = wrapper.echartPanel = wrapper.createPanel({
      position: 'topleft',
      visible: false,
      body: '<div id="fm-echart-chart" style="height: 100%; width: 100%;" />',
      bodyStyle: {
        width: '400px',
        height: '400px'
      },
      // resizable: true,
      header: {
        icon: 'icons/map/chart_icon.svg',
        title: 'liumq'
      }
    })

    echartPanel.on('show', function(e) {
      const target = e.target
      const chartEl = target._bodyEl.firstChild

      const chart = e.target.chart = echarts.init(chartEl)

      chart.setOption(
        {
          backgroundColor: '#ffffff',
          title: {
            top: 20,
            text: 'Requests',
            textStyle: {
              fontWeight: 'normal',
              fontSize: 16
            },
            left: '1%'
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              lineStyle: {
                color: '#57617B'
              }
            }
          },
          legend: {
            top: 20,
            icon: 'rect',
            itemWidth: 14,
            itemHeight: 5,
            itemGap: 13,
            data: ['CMCC', 'CTCC', 'CUCC'],
            right: '4%',
            textStyle: {
              fontSize: 12
            }
          },
          grid: {
            top: 100,
            left: '2%',
            right: '2%',
            bottom: '2%',
            containLabel: true
          },
          xAxis: [{
            type: 'category',
            boundaryGap: false,
            axisLine: {
              lineStyle: {
                color: '#57617B'
              }
            },
            data: ['13:00', '13:05', '13:10', '13:15', '13:20', '13:25', '13:30', '13:35', '13:40', '13:45', '13:50', '13:55']
          }],
          yAxis: [{
            type: 'value',
            name: '(%)',
            axisTick: {
              show: false
            },
            axisLine: {
              lineStyle: {
                color: '#57617B'
              }
            },
            axisLabel: {
              margin: 10,
              textStyle: {
                fontSize: 14
              }
            },
            splitLine: {
              lineStyle: {
                color: '#57617B'
              }
            }
          }],
          series: [{
            name: 'CMCC',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            showSymbol: false,
            lineStyle: {
              normal: {
                width: 1
              }
            },
            areaStyle: {
              normal: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                  offset: 0,
                  color: 'rgba(137, 189, 27, 0.3)'
                }, {
                  offset: 0.8,
                  color: 'rgba(137, 189, 27, 0)'
                }], false),
                shadowColor: 'rgba(0, 0, 0, 0.1)',
                shadowBlur: 10
              }
            },
            itemStyle: {
              normal: {
                color: 'rgb(137,189,27)',
                borderColor: 'rgba(137,189,2,0.27)',
                borderWidth: 12

              }
            },
            data: [220, 182, 191, 134, 150, 120, 110, 125, 145, 122, 165, 122]
          }, {
            name: 'CTCC',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            showSymbol: false,
            lineStyle: {
              normal: {
                width: 1
              }
            },
            areaStyle: {
              normal: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                  offset: 0,
                  color: 'rgba(0, 136, 212, 0.3)'
                }, {
                  offset: 0.8,
                  color: 'rgba(0, 136, 212, 0)'
                }], false),
                shadowColor: 'rgba(0, 0, 0, 0.1)',
                shadowBlur: 10
              }
            },
            itemStyle: {
              normal: {
                color: 'rgb(0,136,212)',
                borderColor: 'rgba(0,136,212,0.2)',
                borderWidth: 12

              }
            },
            data: [120, 110, 125, 145, 122, 165, 122, 220, 182, 191, 134, 150]
          }, {
            name: 'CUCC',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            showSymbol: false,
            lineStyle: {
              normal: {
                width: 1
              }
            },
            areaStyle: {
              normal: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                  offset: 0,
                  color: 'rgba(219, 50, 51, 0.3)'
                }, {
                  offset: 0.8,
                  color: 'rgba(219, 50, 51, 0)'
                }], false),
                shadowColor: 'rgba(0, 0, 0, 0.1)',
                shadowBlur: 10
              }
            },
            itemStyle: {
              normal: {
                color: 'rgb(219,50,51)',
                borderColor: 'rgba(219,50,51,0.2)',
                borderWidth: 12
              }
            },
            data: [220, 182, 125, 145, 122, 191, 134, 150, 120, 110, 165, 122]
          }]
        })
    }, me).on('hide', function(e) {
      echarts.dispose(e.target.chart)
    }, me)

    const drivePoints = wrapper.createCanvas({
      debug: true,
      name: '方向测试数据',
      style: {
        color: 'green'
      }
    })

    window.drive = wrapper.createDriveRoad()
    _$.ajax('./fake/DT-DL_0711-224616_UE1_source_0321133805.json',
      {
        success: function(data, status, jqXHR) {
          const store = window.directionStore = new BaseStore(data, {
            latKey: 'Latitude',
            lngKey: 'Longitude',
            groupKey: 'group',
            crsCode: 'WGS84'
          })

          drivePoints.bindStore(store)
        }
      })
    // 示例代码 - end
  }
  remove() {
    this.mapWrapper.remove()
  }
  getMapWrapper(divId, options) {
    switch (options.engine) {
      case FLEET_MAP_ENGINE_LEAFLET:
        this.mapWrapper = new LeafletWrapper(divId, options)
        break
      default:
        throw new Error('Map engine is required!')
    }
    return this.mapWrapper
  }
}
