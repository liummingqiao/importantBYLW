<template>
  <div class="about">
    <h1>{{id?'编辑':'新建'}}房间</h1>
    <el-form label-width="120px" @submit.native.prevent="save">
      <el-tabs value="basic" type="border-card" @tab-click="toEcharts">
        <el-tab-pane label="基础信息" name="basic">
          <el-form-item label="名称">
            <el-input v-model="model.name"></el-input>
          </el-form-item>
          <el-form-item label="评价">
            <el-input v-model="model.title"></el-input>
          </el-form-item>
          <el-form-item label="楼栋选择">
            <el-select v-model="model.item1">
              <el-option v-for="item in items" :key="item._id" :label="item.name" :value="item._id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select filterable v-model="model.categories" multiple>
              <el-option
                v-for="item in categories"
                :key="item._id"
                :label="item.name"
                :value="item._id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="列表图">
            <el-upload
              class="avatar-uploader"
              :action="uploadUrl"
              :headers="getAuthHeaders()"
              :show-file-list="false"
              :on-success=" res => $set(model,'avatar',res.url)  "
            >
              <img v-if="model.avatar" :src="model.avatar" class="avatar" />
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
            </el-upload>
          </el-form-item>
          <el-form-item label="整体展示">
            <el-upload
              class="avatar-uploader"
              :action="uploadUrl"
              :headers="getAuthHeaders()"
              :show-file-list="false"
              :on-success=" res => $set(model,'banner',res.url)  "
            >
              <img v-if="model.banner" :src="model.banner" class="avatar" />
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
            </el-upload>
          </el-form-item>
          <el-form-item label="房间布局">
            <el-rate :max="9" show-score style="margin-top:0.6rem" v-model="model.scores.difficult"></el-rate>
          </el-form-item>
          <el-form-item label="装修情况">
            <el-rate :max="9" show-score style="margin-top:0.6rem" v-model="model.scores.skills"></el-rate>
          </el-form-item>
          <el-form-item label="光线通风">
            <el-rate :max="9" show-score style="margin-top:0.6rem" v-model="model.scores.attack"></el-rate>
          </el-form-item>
          <el-form-item label="周边环境">
            <el-rate :max="9" show-score style="margin-top:0.6rem" v-model="model.scores.survive"></el-rate>
          </el-form-item>
          <el-form-item label="是否分期">
            <el-switch v-model="ifTow"></el-switch>
          </el-form-item>

          <el-form-item label="总面积">
            <el-input-number v-model="model.numAll" :min="0" label="房间总面积"></el-input-number>（平方米）
          </el-form-item>
          <el-form-item label="客厅">
            <el-input-number v-model="model.numKeTing" :min="0" label="房间总面积"></el-input-number>（平方米）
          </el-form-item>
          <el-form-item label="厨房">
            <el-input-number v-model="model.numChuFang" :min="0" label="房间总面积"></el-input-number>（平方米）
          </el-form-item>
          <el-form-item label="卫生间">
            <el-input-number v-model="model.numWSJ" :min="0" label="房间总面积"></el-input-number>（平方米）
          </el-form-item>
          <el-form-item label="价钱">
            <el-input-number v-model="model.numQian" :min="0" label="房间总面积"></el-input-number>（元/平方米）
          </el-form-item>
          <!-- <el-form-item label="卫生间大小">
            <el-input-number v-model="numAll"  :min="1" label="房间总面积"></el-input-number>（平方米）
          </el-form-item>-->

          <!-- <el-form-item label="对抗技巧">
            <el-input type="textarea" v-model="model.battleTips"></el-input>
          </el-form-item>
          <el-form-item label="团战技巧">
            <el-input type="textarea" v-model="model.teamTips"></el-input>
          </el-form-item>-->
        </el-tab-pane>
        <el-tab-pane label="细节" name="skills">
          <el-button size="small" @click="model.skills.push({})">
            <i class="el-icon-plus"></i>添加细节
          </el-button>
          <el-row type="flex" style="flex-wrap:wrap">
            <el-col :md="12" v-for="(item,i) in model.skills" :key="i">
              <el-form-item label="特点位置">
                <el-input v-model="item.name"></el-input>
              </el-form-item>
              <el-form-item label="图片">
                <el-upload
                  class="avatar-uploader"
                  :action="uploadUrl"
                  :headers="getAuthHeaders()"
                  :show-file-list="false"
                  :on-success="res => $set(item,'icon',res.url)"
                >
                  <img v-if="item.icon" :src="item.icon" class="avatar" />
                  <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                </el-upload>
              </el-form-item>
              <el-form-item label="细节描述">
                <el-input type="textarea" v-model="item.descreption"></el-input>
              </el-form-item>
              <!-- <el-form-item label="价格描述">
                <el-input type="textarea" v-model="item.tips"></el-input>
              </el-form-item>-->
              <el-form-item>
                <el-button type="danger" size="small" @click="model.skills.splice(i,1)">删除</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>
        <el-tab-pane label="图形展示" name="echts">
          <el-row>
            <el-col :span="12">
              <div ref="myChart" :style="{width: '500px', height: '400px'}" />
            </el-col>
            <el-col :span="12">
              <div ref="myChartB" :style="{width: '500px', height: '400px'}" />
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
      <el-form-item>
        <el-button type="primary" native-type="submit">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
const echarts = require("echarts");
export default {
  props: {
    id: {}
  },
  data() {
    return {
      ifTow: true,
      numAll: null,
      model: {
        name: "",
        avatar: "",
        skills: [],
        heroes: [],
        scores: {
          // diffcult: {}
        },
        numAll:0,
        numKeTing: 0,
        numChuFang:0,
        numWSJ: 0,
        numQian: 0
      },
      categories: [],
      items: [],
      heroes: []
    };
  },
  methods: {
    // afterUplode(res) {
    //   this.model.avatar = res.url;
    //   this.$set(this.model, 'icon', res.url);
    // console.log(res.url+"-----"+this.model.icon)
    // },
    async save() {
      let res;
      if (this.id) {
        res = await this.$http.put(`rest/heroes/${this.id}`, this.model);
      } else {
        res = await this.$http.post("rest/heroes", this.model);
      }
      this.$router.push("/heroes/list");
      this.$message({
        type: "success",
        message: "保存成功"
      });
    },
    async fetch() {
      const res = await this.$http.get(`rest/heroes/${this.id}`);
      this.model = Object.assign({}, this.model, res.data);
      console.log("进来了", this.model);
    },
    async fetchCategories() {
      const res = await this.$http.get(`rest/categories`);
      this.categories = res.data;
      // console.log(this.categories);
    },
    async fetchItems() {
      const res = await this.$http.get(`rest/items`);
      this.items = res.data;
      // console.log(this.categories);
    },
    async fetchHeroes() {
      const res = await this.$http.get(`rest/heroes`);
      this.heroes = res.data;
      // console.log(this.categories);
    },
    toEcharts() {
      var myChart = echarts.init(this.$refs.myChart);
      var option = {
        color: ["#3398DB"],
        tooltip: {
          trigger: "axis",
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: "shadow" // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true
        },
        xAxis: [
          {
            type: "category",
            data: ["房间布局", "装修情况", "光线通风", "周边环境"],
            axisTick: {
              alignWithLabel: true
            }
          }
        ],
        yAxis: [
          {
            type: "value"
          }
        ],
        series: [
          {
            name: "直接访问",
            type: "bar",
            barWidth: "60%",
            data: [
              this.model.scores.attack,
              this.model.scores.difficult,
              this.model.scores.skills,
              this.model.scores.survive
            ]
          }
        ]
      };
      console.log(option.series[0].data);
      myChart.setOption(option);
      var myChartB = echarts.init(this.$refs.myChartB);
      var optionB = {
        title: {
          text: "房间面积占比",
          subtext: this.model.name,
          left: "center"
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
          orient: "vertical",
          left: "left",
          data: ["厨房面积", "客厅面积", "卫生间面积"]
        },
        series: [
          {
            name: "面积统计",
            type: "pie",
            radius: "55%",
            center: ["50%", "60%"],
            data: [
              { value: this.model.numChuFang, name: "厨房面积" },
              { value: this.model.numKeTing, name: "客厅面积" },
              { value: this.model.numWSJ, name: "卫生间面积" },
              // { value: 135, name: "视频广告" },
              // { value: 1548, name: "搜索引擎" }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)"
              }
            }
          }
        ]
      };
      myChartB.setOption(optionB);
    }
  },
  watch: {
    model(newdata, olddata) {
      console.log(newdata, olddata);
    }
  },
  created() {
    this.fetchItems();
    this.fetchCategories();
    this.fetchHeroes();
    this.id && this.fetch();
  }
};
</script>
