import Vue from 'vue'
import App from './App.vue'
// require styles
import 'swiper/dist/css/swiper.css'
import VueAwesomeSwiper from 'vue-awesome-swiper'
import Card from './components/Card.vue'

Vue.component('m-card',Card);
Vue.use(VueAwesomeSwiper)


Vue.config.productionTip = false

import './assets/scss/style.scss'
import './assets/iconfont/iconfont.css'
import router from './router'

import './style.scss'

import axios from 'axios'

Vue.prototype.$http = axios.create ({
  baseURL: process.env.Vue_APP_API_URL || '/web/api',
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
