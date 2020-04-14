module.exports = app => {
    const mongoose = require("mongoose")
    mongoose.connect("mongodb://127.0.0.1:27017/node-vue-moba", {
        useNewUrlParser: true
    })
    // A模型引用了B模型 , B模型没用引用运行过A模型可能会报错，所以用require_all  *******  npm i require_all
     require('require-all')(__dirname + '/../models')
}