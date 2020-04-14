<template>
  <div>
    <swiper :options="swiperOption">
      <swiper-slide>
        <img class="w-100" src="../assets/images/1.jpeg" />
      </swiper-slide>
      <swiper-slide>
        <img class="w-100" src="../assets/images/2.jpeg" />
      </swiper-slide>
      <swiper-slide>
        <img class="w-100" src="../assets/images/5.jpeg" />
      </swiper-slide>
      <div class="swiper-pagination pagination-home text-right px-3" slot="pagination"></div>
    </swiper>
    <!-- end of  -->
    <div class="navBox">
      <div class="navItems d-flex flex-wrap text-center bg-white">
        <div class="navItem mt-3 border-color" v-for=" n in 10 " :key="n">
          <i class="sprite sprite-new"></i>
          <div>爆料站</div>
        </div>
      </div>
      <div class="up bg-grey-1 d-flex jc-center py-2 ai-center">
        <i class="sprite sprite-up pl-3"></i>
        <span>收起</span>
      </div>
    </div>
    <m-card icon="Menu" title="新闻资讯" :cardlist="newsCard">
      <template #item="{cardlists}">
        <router-link
          tag="div"
          :to="`/article/${cardcontent._id}`"
          class="ml-3 d-flex fs-lg py-2"
          v-for="(cardcontent,i) in cardlists.newslist"
          :key="i"
        >
          <span class="text-news text-hidden">[{{cardcontent.categoryName}}]</span>
          <span class="px-2">|</span>
          <span class="f-1 text-ellipsis">{{cardcontent.title}}</span>
          <span class="text-news">{{cardcontent.updatedAt | date }}</span>
        </router-link>
      </template>
    </m-card>
    <m-card icon="fenlei-yingxionglianmeng
" title="英雄列表" :cardlist="heroCard">
      <template #item="{cardlists}">
        <div class="d-flex flex-wrap" style="margin-left:1.7rem">
          <router-link
            tag="div"
            :to="`/hero/${hero._id}`"
            class="text-center p-2"
            style="width:18%"
            v-for="(hero,i) in cardlists.herolist"
            :key="i"
          >
            <img :src="hero.avatar" class="w-100" />
            <div>{{hero.name}}</div>
          </router-link>
        </div>
      </template>
    </m-card>
    <m-card icon="Menu" title="精彩视频"></m-card>
    <m-card icon="Menu" title="图文攻略"></m-card>
    <!-- <div class="cardc mt-3 py-3 bg-white">
      <div class="card_nav pl-3 d-flex">
        <i class="iconfont icon-Menu pr-3"></i>
        <span class="f-1">新闻资讯</span>
        <i class="iconfont icon-gengduo pr-3"></i>
      </div>
      <div class="nav_head d-flex jc-between m-3 pt-2">
        <div class="nav_item active">
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
        </div>

      </div>
      <swiper>
        <swiper-slide v-for="n in 5" :key="n">
          <div class="d-flex" v-for="n in 5" :key="n">
            <span>[新闻]</span>
            <span class="f-1">aaaaaaaaaa</span>
            <span>0906</span>
          </div>
        </swiper-slide>
      </swiper>
    </div>-->
  </div>
</template>

<script>
import dayjs from "dayjs";
export default {
  //选择器 引用dayjs
  filters: {
    date(val) {
      return dayjs(val).format("MM/DD");
    }
  },
  data() {
    return {
      swiperOption: {
        pagination: {
          el: ".pagination-home"
        }
      },
      newsCard: [],
      heroCard: []
    };
  },
  methods: {
    async fetchNewsCats() {
      const res = await this.$http.get("news/list");
      this.newsCard = res.data;
    },

    async fetchHeroCats() {
      const res = await this.$http.get("heros/list");
      this.heroCard = res.data;
    }
  },
  created() {
    this.fetchNewsCats();
    this.fetchHeroCats();
  }
};
</script>

<style lang="scss">
@import "../assets/scss/_variable.scss";

.pagination-home {
  .swiper-pagination-bullet {
    opacity: 1;
    border-radius: 0.1538rem;
    background: #fff;
    &.swiper-pagination-bullet-active {
      background: map-get($colors, "info");
    }
  }
}
.navItems {
  border-top: 2px solid $border-color;
  .navItem {
    width: 25%;
    border-right: 2px solid $border-color;
    &:nth-child(4n) {
      border-right: none;
    }
  }
}
.up {
  border-bottom: 2px solid $border-color;
  span {
    color: #5d6585;
  }
}
</style>

