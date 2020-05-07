<template>
  <div>
    <div class="topbar px-3 py-2 bg-black d-flex ai-center">
      <img src="../assets/images/logo.png" height="30" />

      <div class="px-2 flex-grow-1">
        <div class="text-white">小区售房</div>
        <div class="text-hui fs-xxs">售房我们更专业</div>
      </div>
      <button class="bt bg-primary">立即买房</button>
    </div>
    <div class="bg-primary py-2">
      <div class="nav_all text-white d-flex jc-around pt-1">
        <div class="nav_item active">
          <router-link class="nav" tag="div" to="/">首页</router-link>
        </div>
        <div class="nav_item">
          <router-link class="nav" tag="div" to="/article/5d7afd5fcdf0c80a0cfb794d">消息中心</router-link>
        </div>
        <div class="nav_item">
          <router-link class="nav" tag="div" to="/hero/5ea39f61ac88511420d5d162">好房推荐</router-link>
        </div>
      </div>
    </div>

    <router-view></router-view>
  </div>
</template>
<style>
.topbar{
  position: sticky; 
  top:0;
  z-index:999;
}
</style>