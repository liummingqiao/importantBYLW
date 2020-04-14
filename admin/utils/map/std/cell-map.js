import Vue from 'vue'
import echarts from 'echarts'
import CellLookup from '@/components/map/cellLookup/index.vue'
// import { ErrorLog } from '@/components/ErrorLog/index.vue'

// import * as d3 from 'd3'
import { fetchStationMapList } from '@/api/data/baseStation.js'
// 可根据框架选择对应的包装版本
import LeafletWrapper from '../fleet-leaflet/leaflet2fleetmap'
// 可根据框架选择对应的包装版本

export const FLEET_MAP_ENGINE_LEAFLET = 'leaflet'

export default class FleetCellMap {
  dataLayers = {}
  constructor(divId, mapOptions) {
    const op = this.options = Object.assign({}, {
      // 默认配置
      engine: 'leaflet',
      overlay: false
    }, mapOptions)

    var me = this
    const wrapper = this.getMapWrapper(divId, op)
    wrapper.create()
    wrapper.controls.overlays.on('itemremove', function(e) {
      this.mapWrapper.controls.scrollmsg.addMsg(`已删除节点[<strong>${JSON.stringify(e.node)}</strong>]`)
    })

    wrapper.controls.overlays.on('layerchanged', function(e) {
      if (e.node.traceId) {
        const layer = me.dataLayers[e.node.traceId]

        if (layer) {
          console.log(layer)
          layer.setVisible(e.value, e.node.legendKey)
          if (e.node.traceId === 'demo_heatmap') {
            const heatLayer = me.dataLayers[e.node.traceId]
            heatLayer.legend.setVisible(e.value)
          }
        } else {
          var demo = wrapper.createCellOverlay({
            directionKey: 'azimuth',
            labelOffset: 0,
            labelFields: ['cpi', 'cellName']
          })

          me.dataLayers[e.node.traceId] = demo
          fetchStationMapList({ city: e.node.city,
            limit: '',
            page: '',
            field: '',
            isAsc: '',
            orderBy: '',
            networkType: 'LTEFDD' }).then(res => {
            var data = Object.assign([], res.data.data.records)
            // eslint-disable-next-line no-irregular-whitespace
            data.splice(0, 0, Object.assign([], res.data.data.titles))
            console.log('请求成功：', data)
            demo.setData(data, {
              latKey: 'latitude',
              lngKey: 'longitude',
              crsCode: 'WGS84'
            })
          })
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

    const iconOverlay = wrapper.createCanvas({
      name: '图标示例',
      legends: {
        '<=-110': {
          icon: '/static/icons/call_dropped.png'
        },
        '(-110,-105]': {
          icon: '/static/icons/call_end.png'
        },
        '(-105,-100]': {
          icon: '/static/icons/call_setup_failure.png'
        },
        '(-100,-95]': {
          icon: '/static/icons/call_setup.png'
        },
        '(-95,-85]': {
          icon: '/static/icons/no_picture.png'
        },
        '(-85,-75]': {
          icon: '/static/icons/map/a.png'
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
      this.mapWrapper.controls.scrollmsg.addMsg(`您从[<strong>真实数据示例（点）</strong>]层点中了<strong>${data.length}</strong>个元素`)
      this.mapWrapper.controls.scrollmsg.addMsg(`其中第一个元素是<strong>${JSON.stringify(data[0])}</strong>`)
    }, me)
    this.dataLayers['demo1'] = canvasOverlayReal
    wrapper.controls.legend.register(canvasOverlayReal)
    wrapper.controls.draw.on('show', function(e) {})

    wrapper.controls.coordPicker.on('copysuccess', function(e) {
      Vue.prototype.$message({
        message: '坐标已复制',
        type: 'success',
        duration: 1500
      })
    }, me)
    // cell sreach
    const cellSreachPanel = wrapper.cellSreachPanel = wrapper.createPanel({
      position: 'topleft',
      visible: false,
      body: '<div id="cell-lookup" />',
      bodyStyle: {
        width: '300px',
        height: '400px'
      },
      data: [1, 2, 3, 4, 5],
      resizable: true,
      header: {
        icon: '/static/icons/map/chart_icon.svg',
        title: '小区查找'
      }
    })
    cellSreachPanel.on('show', function(e) {
      // console.log(e)
      const target = e.target
      const chartEl = target._bodyEl.firstChild
      var cellSearch = new Vue({
        el: chartEl,
        name: 'LookupCell',
        components: { CellLookup },
        data: {},
        template: `<CellLookup />`
      })
      console.log(cellSearch)
      // const target = e.target
    })
    // cell search end
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
        icon: '/static/icons/map/chart_icon.svg',
        title: 'Chart'
      }
    })

    echartPanel.on('show', function(e) {
      const target = e.target
      const chartEl = target._bodyEl.firstChild

      const chart = e.target.chart = echarts.init(chartEl)
      chart.setOption({
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

    // 业务相关 - end
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
