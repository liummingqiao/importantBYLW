<template>
  <div class="login_container">
   <el-card header="请先登录" class="login_card">
     <el-form @submit.native.prevent="login"> 
       <el-form-item label="用户名">
         <el-input  v-model="model.username"></el-input>
       </el-form-item>
       <el-form-item label="密码">
         <el-input  v-model="model.password"></el-input>
       </el-form-item>
       <el-form-item>
         <el-button type="primary" native-type="submint">登陆</el-button>
       </el-form-item>
     </el-form>
   </el-card>
  </div>
</template>

<script>
export default {
  data(){
    return {
      model:{}
    }
  },
  methods:{
    async login(){
      window.console.log(this.$router)
      //  const res = await this.$http.post('login',this.model)
        // window.console.log(res.data)
      //  sessionStorage.token = res.data.token //on cache
        // localStorage.token = res.data.token //cache
        this.$router.push('/')
        this.$message({
          type:'succsee',
          message:'登录成功'
        })
    }
  }
}
</script>
<style>

.login_card{
  width:25rem;
  margin: 10rem auto;
}
</style>

