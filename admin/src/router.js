import Vue from 'vue'
import Router from 'vue-router'
import Login from './views/Login.vue'
import Main from './views/Main.vue'
import CategoryEidt from './views/CategoryEidt.vue'
import CategoryList from './views/CategoryList.vue'
import ItemEidt from './views/ItemEidt.vue'
import ItemList from './views/ItemList.vue'
import HeroEidt from './views/HeroEidt.vue'
import HeroList from './views/HeroList.vue'
import ArticleEidt from './views/ArticleEidt.vue'
import ArticleList from './views/ArticleList.vue'
import AdminUserEidt from './views/AdminUserEidt.vue'
import AdminUserList from './views/AdminUserList.vue'
import AdEidt from './views/AdEidt.vue'
import AdList from './views/AdList.vue'
Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { isPublic: true }
    },
    {
      path: '/',
      name: 'main',
      component: Main,
      children: [
        {
          path: "/categories/create", component: CategoryEidt
        },
        {
          path: "/categories/list", component: CategoryList
        },
        {
          path: "/categories/eidt/:id", component: CategoryEidt, props: true
        },
        {
          path: "/items/create", component: ItemEidt
        },
        {
          path: "/items/list", component: ItemList
        },
        {
          path: "/items/eidt/:id", component: ItemEidt, props: true
        },
        {
          path: "/heroes/create", component: HeroEidt
        },
        {
          path: "/heroes/list", component: HeroList
        },
        {
          path: "/heroes/eidt/:id", component: HeroEidt, props: true
        },
        {
          path: "/articles/create", component: ArticleEidt
        },
        {
          path: "/articles/list", component: ArticleList
        },
        {
          path: "/articles/eidt/:id", component: ArticleEidt, props: true
        },
        {
          path: "/ads/create", component: AdEidt
        },
        {
          path: "/ads/list", component: AdList
        },
        {
          path: "/ads/eidt/:id", component: AdEidt, props: true
        },
        {
          path: "/admin_users/create", component: AdminUserEidt
        },
        {
          path: "/admin_users/list", component: AdminUserList
        },
        {
          path: "/admin_users/eidt/:id", component: AdminUserEidt, props: true
        },
      ]
    },
  ]
})

// router.beforeEach((to, from, next) => {
//   if (!to.meta.isPublic && !localStorage.token) {
//     return next('/login')
//    }
//    next()
// })
export default router