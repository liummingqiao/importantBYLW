// locales.[组件].[key]
window.locales = {
  common: {
    yes: 'Yes',
    no: 'No',
    save: 'Save',
    clear: 'Clear',
    add: 'Add',
    cancel: 'Cancel'
  },
  toolbar: {
    layers: 'Layers',
    tiles: 'Maps',
    toolkits: 'Toolkits',
    legend: 'Legend',
    measure: 'Measure',
    draw: 'Draw',
    locate: 'Locate',
    pickup: 'Pick',
    direction: 'Test Direction',
    cell_coverage: 'Cell',
    cell_search: 'Cell Lookup',
    charts: 'Chart',
    streetview: 'Street View'
  },
  layers: {
    baidu: 'Baidu',
    baidu_sat: 'Baidu-Satellite',
    baidu_street: 'Baidu-Street View',
    gaode: 'Gaode',
    gaode_sat: 'Gaode-Satellite',
    osm: 'Open Street Map',
    google: 'Google',
    google_sat: 'Google-Satellite',
    google_street: 'Google-Street View',
    tencent: 'Tencent',
    tencent_sat: 'Tencent-Satellite'
  },
  streetview: {
    baidu_title: 'Baidu Street View',
    google_title: 'Google Street View',
    picker: 'Pick',
    tile_switch: 'Toggle Path',
    default_msg: 'Start with pickup on RIGHT',
    initializing: 'Initializing...',
    not_found: 'No Street View infomation!',
    requesting: 'Requesting Street Infomation...'
  },
  legend: {
    title: 'Legend'
  },
  measure: {
    length: 'Length',
    area: 'Area',
    clear: 'Clear',
    total: 'Total',
    start: 'Start',
    meter: 'm',
    kilometer: 'km',
    sqmeter: 'm²',
    sqkilometer: 'km²',
    polygon: {
      tooltip: {
        start: 'Click to start drawing shape.',
        cont: 'Click to continue drawing shape.',
        end: 'Click first point to close this shape.'
      }
    },
    polyline: {
      error: '<strong>Error:</strong> shape edges cannot cross!',
      tooltip: {
        start: 'Click to start drawing line.',
        cont: 'Click to continue drawing line.',
        end: 'Click last point to finish line.'
      }
    }
  },
  draw: {
    tooltips: {
      firstVertex: 'Click to place first vertex',
      continueLine: 'Click to continue drawing',
      finishLine: 'Click any existing marker to finish',
      finishPoly: 'Click first marker to finish',
      finishRect: 'Click to finish'
    },
    actions: {
      finish: 'Finish',
      cancel: 'Cancel',
      removeLastVertex: 'Remove Last Vertex'
    },
    buttonTitles: {
      drawPolyButton: 'Draw Polygons',
      drawLineButton: 'Draw Polyline',
      drawRectButton: 'Draw Rectangle',
      editButton: 'Edit Layers',
      dragButton: 'Drag Layers',
      deleteButton: 'Remove Layers'
    }
  },
  locate: {
    prompt: 'Search for place or coordinate(Lng, Lat)',
    latitude: 'Latitude',
    longitude: 'Longitude',
    place: 'Place',
    unknownPlace: '[Unknown Place]',
    clear: 'Clear',
    search: 'Search'
  },
  coordPicker: {
    copy: 'Copy',
    pickup: 'Pickup'
  }
}
