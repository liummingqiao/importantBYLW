<template>
  <!-- V-IF 防止第一遍刷新的时候会出现{{model.name}}没有被加载 -->
  <div class="page-hero" v-if="model">
    <div class="topbar px-3 py-2 bg-black d-flex ai-center">
      <img src="../assets/images/king.jpg" height="30" />

      <div class="px-2 flex-grow-1 text-white">
        <span class="text-white">王者荣耀</span>
        <span class="text-white fs-xxs pl-3">攻略站</span>
      </div>
      <span class="text-white">
        更多英雄
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
          难度
          <div class="yuan bg-primary">{{model.scores.difficult}}</div>技能
          <div class="yuan bg-primary">{{model.scores.skills}}</div>攻击
          <div class="yuan bg-primary">{{model.scores.attack}}</div>生存
          <div class="yuan bg-primary ">{{model.scores.survive}}</div>
          <span class="pifu text-white">皮肤 &gt;</span>
        </div>
      </div>
    </div>
    <h1>{{model.name}}</h1>
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
    async fetch() {
      const res = await this.$http.get(`/hero/${this.id}`);
      this.model = res.data;
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
  .pifu{
    margin-left: 12rem
  }
}
</style>
