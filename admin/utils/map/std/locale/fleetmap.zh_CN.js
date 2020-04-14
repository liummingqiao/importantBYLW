// locales.[组件].[key]
window.locales = {
  common: {
    yes: '是',
    no: '否',
    save: '保存',
    clear: '清除',
    add: '添加',
    cancel: '取消'
  },
  toolbar: {
    layers: '图层',
    tiles: '地图',
    toolkits: '工具',
    legend: '图例',
    measure: '测量',
    draw: '绘制',
    locate: '定位',
    pickup: '坐标拾取',
    direction: '测试方向',
    cell_coverage: '小区覆盖',
    cell_search: '查找小区',
    charts: '图表',
    streetview: '街景'
  },
  layers: {
    baidu: '百度',
    baidu_sat: '百度-卫星',
    baidu_street: '百度-街景',
    gaode: '高德',
    gaode_sat: '高德-卫星',
    osm: 'OSM',
    google: '谷歌',
    google_sat: '谷歌-卫星',
    google_street: '谷歌-街景',
    tencent: '腾讯',
    tencent_sat: '腾讯-卫星'
  },
  streetview: {
    baidu_title: '百度街景',
    google_title: '谷歌街景',
    picker: '街景重选',
    tile_switch: '切换街景轨迹',
    default_msg: '请点击<strong>右边</strong>开始',
    initializing: '初始化中...',
    not_found: '未找到街景信息!',
    requesting: '正在请求全景信息...'
  },
  legend: {
    title: '图例'
  },
  measure: {
    length: '长度',
    area: '面积',
    clear: '清除',
    total: '总长',
    start: '起点',
    meter: '米',
    kilometer: '公里',
    sqmeter: '平方米',
    sqkilometer: '平方公里',
    polygon: {
      tooltip: {
        start: '单击开始绘制图形',
        cont: '单击继续绘制图形',
        end: '单击继续绘制，双击完成绘制'
      }
    },
    polyline: {
      error: '<strong>异常：</strong> 图形边框不允许相交',
      tooltip: {
        start: '单击开始画线',
        cont: '单击继续画线',
        end: '单击继续画线，双击完成绘制'
      }
    }
  },
  draw: {
    tooltips: {
      firstVertex: '单击放置首个顶点',
      continueLine: '单击继续绘制',
      finishLine: '单击任何存在的标记以完成',
      finishPoly: '单击第一个标记以完成',
      finishRect: '单击完成'
    },
    actions: {
      finish: '完成',
      cancel: '取消',
      removeLastVertex: '移除最后的顶点'
    },
    buttonTitles: {
      drawPolyButton: '绘制多边形',
      drawLineButton: '绘制线段',
      drawRectButton: '绘制矩形',
      editButton: '编辑图层',
      dragButton: '拖拽图层',
      deleteButton: '删除图层'
    }
  },
  locate: {
    prompt: '搜索地点或坐标（经度, 纬度）',
    latitude: '纬度',
    longitude: '经度',
    place: '地点',
    unknownPlace: '[未知地点]',
    clear: '清除',
    search: '搜索'
  },
  coordPicker: {
    copy: '复制',
    pickup: '拾取'
  }
}
