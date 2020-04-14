<template>
  <div>
    <div class="topbar px-3 py-2 bg-black d-flex ai-center">
      <img src="../assets/images/king.jpg" height="30" />

      <div class="px-2 flex-grow-1">
        <div class="text-white">王者荣耀</div>
        <div class="text-hui fs-xxs">团队成就更多</div>
      </div>
      <button class="bt bg-primary">立即下载</button>
    </div>
    <div class="bg-primary py-2">
      <div class="nav_all text-white d-flex jc-around pt-1">
        <div class="nav_item active">
          <router-link class="nav" tag="div" to="/">首页</router-link>
        </div>
        <div class="nav_item">
          <router-link class="nav" tag="div" to="/">个人中心</router-link>
        </div>
        <div class="nav_item">
          <router-link class="nav" tag="div" to="/">技术中心</router-link>
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