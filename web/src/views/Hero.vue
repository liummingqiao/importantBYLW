<template>
  <!-- V-IF 防止第一遍刷新的时候会出现{{model.name}}没有被加载 -->
  <div class="page-hero" v-if="model">
    <div class="topbar px-3 py-2 bg-black d-flex ai-center">
      <img src="../assets/images/logo.png" height="30" />

      <div class="px-2 flex-grow-1 text-white">
        <span class="text-white">售房</span>
        <span class="text-white fs-xxs pl-3">详细站</span>
      </div>
      <span class="text-white" @click="toH">
        更多房间
        <strong class="fs-xg pl-2">&gt;</strong>
      </span>
    </div>

    <div class="heard_1" :style="{'background-image':`url(${model.banner})`}">
      <div class="heard d-flex flex-d jc-end text-white pl-3">
        <!-- <img :src="model.banner" width="100%" height="auto"  > -->
        <!-- {{model.banner}} -->
        <div class="top text-white py-1">{{model.title}}</div>
        <strong class="py-1 fs-xxg">{{model.name}}</strong>
        <div class="py-1">{{model.categories.map(v => v.name).join('/')}}</div>
        <div class="d-flex">
          布局
          <div class="yuan bg-primary">{{model.scores.difficult}}</div>装修
          <div class="yuan bg-primary">{{model.scores.skills}}</div>光线
          <div class="yuan bg-primary">{{model.scores.attack}}</div>周边
          <div class="yuan bg-primary">{{model.scores.survive}}</div>
        </div>
      </div>
    </div>
    <h1>{{model.name}}</h1>
    <h3>价钱：{{model.numQian}}元/平方米</h3>
    <h3>房间总大小：{{model.numAll}}平方米</h3>
    <h3>卫生间大小：{{model.numWSJ}}平方米</h3>
    <h3>厨房大小：{{model.numChuFang}}平方米</h3>
    <h3>客厅大小：{{model.numKeTing}}平方米</h3>
    <!-- <el-input  v-model="model.numQian" :disabled="true"></el-input> -->
    <div v-for=" i in model.skills" :key="i._id" style="margin-top:1rem">
      <h3>详细介绍：{{i.name}}</h3>
      <div class="contor" :style="{'background-image':`url(${i.icon})`}"></div>
      <span>{{i.descreption}}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    id: { required: true }
  },
  data() {
    return {
      model: null
    };
  },
  methods: {
    toH(){
      window.console.log('zhixingle')
      this.$router.push('/')
    },
    async fetch() {
      const res = await this.$http.get(`/hero/${this.id}`);
      this.model = res.data;
      console.log(this.model);
    }
  },

  created() {
    this.fetch();
  }
};
</script>
<style lang="scss">
.page-hero {
  .heard_1 {
    background: center no-repeat;
    background-size: auto 100%;
    height: 50vw;
    .heard {
      height: 50vw;
      background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
    }
  }
  // .new {
  //   background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
  .yuan {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    text-align: center;
    border: 1px #fff solid;
    font-size: 10px;
    line-height: 1rem;
  }
  .pifu {
    margin-left: 12rem;
  }
  .contor {
    height: 30vh;
    width: 34vw;
    // border-radius: 7.5vw;
    margin-left: 30%;
    margin-bottom: 3vh;
  }
}
</style>
