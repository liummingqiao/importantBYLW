<template>
  <div class="cardc mt-3 py-3 bg-white">
    <div class="card_nav pl-3 d-flex">
      <i class="iconfont pr-3" :class="`icon-${icon}`"></i>
      <span class="f-1">{{title}}</span>
      <i class="iconfont icon-gengduo pr-3"></i>
    </div>
    <div>
      <div class="nav_head d-flex jc-between m-3 pt-2">
        <div
          class="nav_item"
          v-for="(cardlists,i) in cardlist"
          :key="i"
          :class="{active:active===i}"
          @click="$refs.list.swiper.slideTo(i)"
        >
          <div class="nav-link">{{cardlists.name}}</div>
        </div>
        <!-- <div class="nav_item active">
          <div class="nav-link">新闻</div>
        </div>
        <div class="nav_item">
          <div class="nav-link">新闻</div>
        </div>
        <div class="nav_item">
          <div class="nav-link">新闻</div>
        </div>
        <div class="nav_item">
          <div class="nav-link">新闻</div>
        </div>
        <div class="nav_item">
          <div class="nav-link">新闻</div>
        </div>-->
      </div>
      <swiper
        ref="list"
        :options="{autoHeight:true}"
        @slide-change="()=>active = $refs.list.swiper.realIndex"
      >
        <swiper-slide v-for="(cardlists,i) in cardlist" :key="i">
          <slot name="item" :cardlists="cardlists"></slot>
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      active: 0
    };
  },
  props: {
    title: { type: String, require: true },
    icon: { type: String, require: true },
    cardlist: { type: Array, require: true }
  }
};
</script>

<style lang="scss">
@import "../assets/scss/variable.scss";
.nav_head {
  border-top: 3px solid $border-color;
  .nav_item {
    padding-bottom: 0.2rem;
    border-bottom: 3px solid transparent;
    &.active {
      color: map-get($colors, "primary");
      border-bottom: 3px solid map-get($colors, "primary");
    }
  }
}
</style>