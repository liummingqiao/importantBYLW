<template>
  <div class="about">
    <el-button type="primary" @click="dialogTableVisible=true">添加位置</el-button>
    <div class="map" style="height:500px;weigth:500px">
      <div id="lmap" class="map" style="height:500px;weigth:500px" />
    </div>
    <el-dialog title="收货地址" :visible.sync="dialogTableVisible">
      <el-form label-width="120px" @submit.native.prevent="save">
        <el-form-item label="名字">
          <el-input v-model="model.name"></el-input>
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model="model.lat"></el-input>
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model="model.lng"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">保存</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
export default {
  props: {
    id: {}
  },
  data() {
    return {
      dialogTableVisible: false,
      adlist: null,
      objGPS: {
        name: 'GPS',
        clickable: true,
        clickType: 1,
        legends: {
          'GPS': { color: '#909399' }
        },
        realResponse: true,
        offsetX: 0, // 偏移
        offsetY: 0 // 偏移
      },
      newArrGPS: [],
      zoom: 15,
      center: [39.33767197, 112.47992773],
      model: {}
    };
  },
  mounted() {
    // this.mapWrapper = new LeafletWrapper(divId, options)
    var newArr = [["lat", "lng", "group"]];
    window.map = this.lmap = new FM.FleetMap("lmap", {
      center: this.center,
      zoom: this.zoom,
      contextmenu: true,
      tilelayer: false,
      scalecontrol: true,
      zoomcontrol: true,
      baselayer: true,
      legend: true,
      scrollmsg: false,
      measure: true,
      draw: true,
      locate: true,
      coordpicker: true
    }).mapWrapper;
    this.lmap.dataLayers = {};
  },
  destroyed() {
    this.lmap.remove();
  },
  methods: {
    async getALL() {
      const res = await this.$http.get("rest/ads");
      this.adlist = res;
      var newArr = [["lat", "lng", "group"]];
      this.adlist.data.map(item => {
        var obj = [];
        obj.push(item.lat, item.lng, "GPS");
        newArr.push(obj);
      });
      console.log(newArr, "拼接后数组");
      this.newArrGPS = newArr;
      console.log(this.objGPS,'objgps')
      console.log(this.lmap,'map')
      var demoGPS = this.lmap.createCanvas(this.objGPS);
      this.lmap.dataLayers[this.objGPS.name] = demoGPS;
      console.log(this.newArrGPS, "传入地图");
      demoGPS.setData(this.newArrGPS, {
        groupKey: "group",
        latKey: "lat",
        lngKey: "lng"
      });
      demoGPS.setVisible(true);
    },
    async save() {
      let res;
      if (this.id) {
        res = await this.$http.put(`rest/ads/${this.id}`, this.model);
      } else {
        res = await this.$http.post("rest/ads", this.model);
      }
      this.$router.push("/ads/list");
      this.$message({
        type: "success",
        message: "保存成功"
      });
    },

    async fetch() {
      this.dialogTableVisible = true;
      const res = await this.$http.get(`rest/ads/${this.id}`);
      console.log(res, "res");
      this.model = Object.assign({}, this.model, res.data);
      console.log(this.model);
    }
  },
  created() {
    this.id && this.fetch();
    this.getALL();
  }
};
</script>