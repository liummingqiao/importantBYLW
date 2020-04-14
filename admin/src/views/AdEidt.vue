<template>
  <div class="about">
        <div class="map" style="height:500px;weigth:500px" >
        <div id="lmap" class="map" style="height:500px;weigth:500px"  />
      </div>
    <h1>{{id?'编辑':'新建'}}广告位</h1>
    <el-form label-width="120px" @submit.native.prevent="save">
      <el-form-item label="名称">
        <el-input v-model="model.name"></el-input>
      </el-form-item>
      <el-form-item label="广告位">
        <el-button size="small" @click="model.items.push({})">
          <i class="el-icon-plus"></i>添加广告
        </el-button>
        <el-row type="flex" style="flex-wrap:wrap">
          <el-col :md="2" v-for="(item,i) in model.items" :key="i">
            <el-form-item label="跳转连接（url）">
              <el-input v-model="item.url"></el-input>
            </el-form-item>
            <el-form-item label="图片" style="margin-top:0.5rem">
              <el-upload
                class="avatar-uploader"
                :action="$http.defaults.baseURL+'/upload'"
                :show-file-list="false"
                :on-success="res => $set(item,'image',res.url)"
              >
                <img v-if="item.image" :src="item.image" class="avatar" />
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="danger" size="small" @click="model.items.splice(i,1)">删除</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  props: {
    id: {}
  },
  data() {
    return {
      zoom: 15,
      center: [30.6191463470459, 122.0928726196289],
      model: {
        items: []
      }
    };
  },
   mounted() {
    // this.mapWrapper = new LeafletWrapper(divId, options)
    window.map = this.lmap = (new FM.FleetMap('lmap', {
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
    })).mapWrapper
    this.lmap.dataLayers = {}
  },
  destroyed() {
    this.lmap.remove()
  },
  methods: {
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
      const res = await this.$http.get(`rest/ads/${this.id}`);
      this.model = Object.assign({}, this.model, res.data);
    }
  },
  created() {
    this.id && this.fetch();
  }
};
</script>