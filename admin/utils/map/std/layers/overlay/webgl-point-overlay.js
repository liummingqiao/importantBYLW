import PointOverlay from './point-overlay'

const DEFAULT_OPTIONS = {
  debug: false
}

class WebglPointOverlay extends PointOverlay {
  useWebGL = true
  glAttrs = {
    u_matLoc: undefined,
    colorLoc: undefined,
    vertLoc: undefined,
    aPointSize: undefined,
    legendIdx1Pos: undefined,
    legendIdx2Pos: undefined
  }
  pixelsToWebGLMatrix = new Float32Array(16)
  mapMatrix = new Float32Array(16)
  /**
   * 点数据渲染图层， webgl 技术
   * @constructs WebglPointOverlay
   * @extends PointOverlay
   * @memberof std/layers/overlay/
   * @param {object} opts 请参考 [std/layers/overlay/PointOverlay]{@link PointOverlay}
   */
  constructor(opts) {
    super(Object.assign({}, DEFAULT_OPTIONS, opts))
  }

  onAdd() {
    super.onAdd()

    const me = this
    me._glCtx = me._canvas.getContext('experimental-webgl', { antialias: true }) || me._canvas.getContext('webgl', { antialias: true })
    // me.available = !!glCtx
    // if (!me.available) {
    //   console.error('您的浏览器不支持硬件加速(WebGL)!')
    // }

    return this
  }
  onRemove() {
    if (this.store) {
      this.store.off('refresh', this._compileData)
    }
    if (this._glCtx && this._glCtx.getExtension('WEBGL_lose_context')) {
      this._glCtx.getExtension('WEBGL_lose_context').loseContext()
    }
    super.onRemove()
  }
  bindStore(store) {
    const me = this
    super.bindStore(store)
    me._compileData()
    store.on('refresh', me._compileData, me)
    me._onStoreBind(store)
  }
  _compileData() {
    // 处理 webgl 的数据传递
    const me = this

    const store = me.store
    const options = me.options
    const verts = []
    const gl = me._glCtx
    const glAttrs = me.glAttrs
    const program = me._createProgram(me.vshaderPoint, me.fshaderPoint)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.BLEND)
    //  gl.disable(gl.DEPTH_TEST);
    // ----------------------------
    // look up the locations for the inputs to our shaders.
    glAttrs.u_matLoc = gl.getUniformLocation(program, 'u_matrix')
    glAttrs.colorLoc = gl.getAttribLocation(program, 'a_color')
    glAttrs.vertLoc = gl.getAttribLocation(program, 'a_vertex')
    gl.aPointSize = glAttrs.aPointSize = gl.getAttribLocation(program, 'a_pointSize')
    for (let i = 0; i < 20; i++) {
      glAttrs[`legendIdx${i}`] = gl.getUniformLocation(program, `legendIdx${i}`)
    }
    glAttrs.legendLoc = gl.getAttribLocation(program, 'a_legendIdx')
    glAttrs.filterLoc = gl.getAttribLocation(program, 'a_filtered')

    // Set the matrix to some that makes 1 unit 1 pixel.

    let pixel

    const groups = store.getGroups()
    const legends = options.legends
    let groupData
    let aLegend
    let color
    // 注意，这个数据 verts 的 push顺序同时影响 filter中的处理顺序，请两边一起修改
    Object.keys(groups).forEach(function(groupKey) {
      aLegend = legends[groupKey]
      // 将颜色
      color = me.COLOR_SETTING.transform(aLegend.color)
      groupData = groups[groupKey].getData()
      groupData.forEach(function(row) {
        pixel = me._getProjectionOffset(
          {
            lat: row.compiledLatLng.lat,
            lng: row.compiledLatLng.lng
          }
        )
        verts.push(pixel.x, pixel.y, color[0] / 255, color[1] / 255, color[2] / 255, aLegend.idx, row._filtered === false ? 0.0 : 1.0)
      })
    })
    me.lastVerts = verts
    const vertArray = new Float32Array(verts)
    const fsize = vertArray.BYTES_PER_ELEMENT
    const dataLen = fsize * 7

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.DYNAMIC_DRAW)
    gl.vertexAttribPointer(glAttrs.vertLoc, 2, gl.FLOAT, false, dataLen, 0)
    gl.enableVertexAttribArray(glAttrs.vertLoc)
    gl.vertexAttribPointer(glAttrs.colorLoc, 3, gl.FLOAT, false, dataLen, fsize * 2)
    gl.enableVertexAttribArray(glAttrs.colorLoc)
    gl.vertexAttribPointer(glAttrs.legendLoc, 1, gl.FLOAT, false, dataLen, fsize * 5)
    gl.enableVertexAttribArray(glAttrs.legendLoc)
    gl.vertexAttribPointer(glAttrs.filterLoc, 1, gl.FLOAT, false, dataLen, fsize * 6)
    gl.enableVertexAttribArray(glAttrs.filterLoc)
  }
  _storeFiltered(e) {
    const me = this
    const verts = me.lastVerts
    // 注意，这个数据 verts 的 update顺序使用 原始压缩的处理顺序，请两边一起修改
    if (verts && verts.length > 0) {
      const store = me.store
      const groups = store.getGroups()
      let groupData
      let idx = 0
      Object.keys(groups).forEach(function(groupKey) {
        groupData = groups[groupKey].getData()
        groupData.forEach(function(row) {
          verts[idx * 7 + 6] = row._filtered === false ? 0.0 : 1.0
          idx++
        })
      })
    }

    const gl = me._glCtx
    const glAttrs = me.glAttrs
    const vertArray = new Float32Array(verts)
    const fsize = vertArray.BYTES_PER_ELEMENT
    const dataLen = fsize * 7

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.DYNAMIC_DRAW)
    gl.vertexAttribPointer(glAttrs.vertLoc, 2, gl.FLOAT, false, dataLen, 0)
    gl.enableVertexAttribArray(glAttrs.vertLoc)
    gl.vertexAttribPointer(glAttrs.colorLoc, 3, gl.FLOAT, false, dataLen, fsize * 2)
    gl.enableVertexAttribArray(glAttrs.colorLoc)
    gl.vertexAttribPointer(glAttrs.legendLoc, 1, gl.FLOAT, false, dataLen, fsize * 5)
    gl.enableVertexAttribArray(glAttrs.legendLoc)
    gl.vertexAttribPointer(glAttrs.filterLoc, 1, gl.FLOAT, false, dataLen, fsize * 6)
    gl.enableVertexAttribArray(glAttrs.filterLoc)

    me.repaint()
    me.fire('storechange', { store: this.store })
  }
  onDraw(param) {
    var me = this

    if (!me.store || me.store.getSize() === 0 || !me.options.visible) {
      return
    }
    var gl = me._glCtx
    var bounds = param.bounds
    var zoom = param.zoom
    var canvas = me._canvas
    var glAttrs = me.glAttrs
    var store = me.store
    var pixelsToWebGLMatrix = me.pixelsToWebGLMatrix
    var mapMatrix = me.mapMatrix

    if (gl == null) return

    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    pixelsToWebGLMatrix.set([2 / canvas.width, 0, 0, 0, 0, -2 / canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1])
    // gl.viewport(0, 0, canvas.width, canvas.height)
    gl.viewport(0, 0, canvas.width, canvas.height)
    me.lastDrawSize = me.getDrawSize(zoom)
    gl.vertexAttrib1f(gl.aPointSize, me.lastDrawSize)

    // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
    mapMatrix.set(pixelsToWebGLMatrix)

    var topLeft = {
      lat: bounds.north,
      lng: bounds.west
    }
    var offset = this._getProjectionOffset(topLeft)

    // -- Scale to current zoom
    var scale = Math.pow(2, zoom)

    me.scaleMatrix(mapMatrix, scale, scale)
    me.translateMatrix(mapMatrix, -offset.x, -offset.y)

    // -- attach matrix value to 'mapMatrix' uniform in shader
    gl.uniformMatrix4fv(glAttrs.u_matLoc, false, mapMatrix)
    me._deliverOpacity()
    // const uniformArray = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    // gl.uniform4f(glAttrs.legendIdx1Pos, uniformArray[0], uniformArray[1], uniformArray[2], uniformArray[3])
    // gl.uniform4f(glAttrs.legendIdx2Pos, uniformArray[4], uniformArray[5], uniformArray[6], uniformArray[7])
    // gl.uniform4f(glAttrs.legendIdx3Pos, uniformArray[8], uniformArray[9], uniformArray[10], uniformArray[11])
    gl.drawArrays(gl.POINTS, 0, store.getSize())
  }
  translateMatrix(matrix, tx, ty) {
    // translation is in last column of matrix
    matrix[12] += matrix[0] * tx + matrix[4] * ty
    matrix[13] += matrix[1] * tx + matrix[5] * ty
    matrix[14] += matrix[2] * tx + matrix[6] * ty
    matrix[15] += matrix[3] * tx + matrix[7] * ty
  }

  scaleMatrix(matrix, scaleX, scaleY) {
    // scaling x and y, which is just scaling first two columns of matrix
    matrix[0] *= scaleX
    matrix[1] *= scaleX
    matrix[2] *= scaleX
    matrix[3] *= scaleX

    matrix[4] *= scaleY
    matrix[5] *= scaleY
    matrix[6] *= scaleY
    matrix[7] *= scaleY
  }
  _createProgram(vstr, fstr) {
    var me = this
    var gl = me._glCtx
    var program = gl.createProgram()
    var vertexShader = me._createShader(gl, gl.VERTEX_SHADER, vstr)
    var fragmentShader = me._createShader(gl, gl.FRAGMENT_SHADER, fstr)
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.useProgram(program)
      return program
    } else {
      console.error('create WebGL program failed: ', gl.getProgramInfoLog(program))
    }
  }
  // 创建着色器, webgl 专属
  _createShader(gl, type, shaderSource) {
    var shader = gl.createShader(type)
    gl.shaderSource(shader, shaderSource)
    gl.compileShader(shader)
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader
    } else {
      console.error('create WebGL shader failed: ', type, shaderSource, gl.getShaderInfoLog(shader))
    }
  }
  _deliverOpacity() {
    const me = this
    const legends = me.options.legends
    const glAttrs = me.glAttrs
    const gl = me._glCtx
    Object.values(legends).forEach(function(legend) {
      gl.uniform1f(glAttrs[`legendIdx${legend.idx}`], legend.visible === false ? 0.0 : legend.opacity)
    })
  }

  vshaderPoint = `
    precision mediump float;
    uniform mat4 u_matrix;
    attribute vec4 a_vertex;
    attribute float a_pointSize;
    attribute vec4 a_color;
    attribute float a_legendIdx;
    attribute float a_filtered;
    varying float v_legendIdx;
    varying float v_filtered;
    varying vec4 v_color;
    void main() {
    // Set the size of the point
      gl_PointSize =  a_pointSize;
    // multiply each vertex by a matrix.
      gl_Position = u_matrix * a_vertex;
    // pass the color to the fragment shader
      v_color = a_color;
      v_legendIdx = a_legendIdx;
      v_filtered = a_filtered;
    }`
  fshaderPoint = `
    precision mediump float;
    varying vec4 v_color;
    varying float v_filtered;
    
    uniform float legendIdx0;
    uniform float legendIdx1;
    uniform float legendIdx2;
    uniform float legendIdx3;
    uniform float legendIdx4;
    uniform float legendIdx5;
    uniform float legendIdx6;
    uniform float legendIdx7;
    uniform float legendIdx8;
    uniform float legendIdx9;
    uniform float legendIdx10;
    uniform float legendIdx11;
    uniform float legendIdx12;
    uniform float legendIdx13;
    uniform float legendIdx14;
    uniform float legendIdx15;
    uniform float legendIdx16;
    uniform float legendIdx17;
    uniform float legendIdx18;
    uniform float legendIdx19;
    varying float v_legendIdx;

    void main() {
      float border = 0.05;
      float radius = 0.5;
      vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);
      vec4 color1; 
      int idx = int(v_legendIdx);
      if (idx == 0) { color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx0 * v_filtered); }
      else if (idx == 1) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx1 * v_filtered); }
      else if (idx == 2) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx2 * v_filtered); }
      else if (idx == 3) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx3 * v_filtered); }
      else if (idx == 4) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx4 * v_filtered); }
      else if (idx == 5) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx5 * v_filtered); }
      else if (idx == 6) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx6 * v_filtered); }
      else if (idx == 7) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx7 * v_filtered); }
      else if (idx == 8) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx8 * v_filtered); }
      else if (idx == 9) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx9 * v_filtered); }
      else if (idx == 10) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx10 * v_filtered); }
      else if (idx == 11) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx11 * v_filtered); }
      else if (idx == 12) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx12 * v_filtered); }
      else if (idx == 13) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx13 * v_filtered); }
      else if (idx == 14) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx14 * v_filtered); }
      else if (idx == 15) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx15 * v_filtered); }
      else if (idx == 16) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx16 * v_filtered); }
      else if (idx == 17) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx17 * v_filtered); }
      else if (idx == 18) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx18 * v_filtered); }
      else if (idx == 19) {  color1 = vec4(v_color[0], v_color[1], v_color[2], legendIdx19 * v_filtered); }
      else { color1 = vec4(v_color[0], v_color[1], v_color[2], 1.0 * v_filtered);}
      
      vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
      float dist = radius - sqrt(m.x * m.x + m.y * m.y);
      float t = 0.0;
      if (dist > border)
        t = 1.0;
      else if (dist > 0.0)
        t = dist / border;
      gl_FragColor = mix(color0, color1, t);
    }`
}

export default WebglPointOverlay
