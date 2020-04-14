<template>
  <div class="about" v-if="model">
    <div class="d-flex border-bottom py-3">
      <div class="iconfont icon-back text-article"></div>
      <!-- <strong> -->
      <strong class="fs-md text-article f-1 text-ellipsis">{{model.title}}</strong>
      <!-- </strong> -->
      <div class="fs-xxs text-grey text-hidden pl-1">2019-09-16</div>
    </div>
     <div v-html="model.body" class="body"></div>
    <div>
      <div class="d-flex py-3 border-bottom">
      <div class="iconfont icon-news"></div>
      <div>相关链接</div>
      </div>
      <div>
        <router-link
          tag="div"
          :to="`/article/${item._id}`"
          v-for="item in model.related"
          :key="item._id"
        >{{item.title}}</router-link>
      </div>
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
    async fetch() {
      const res = await this.$http.get(`article/${this.id}`);
      this.model = res.data;
    }
  },
  watch:{
    id()  {
      this.fetch()
    }
  },
  created() {
    this.fetch();
  }
};
</script>

<style lang="scss">
.about {
  .icon-back {
    font-size: 1.9231rem;
  }
  .body {
    img {
      max-width: 100%;
      height: auto;
    }
  }
}
</style>