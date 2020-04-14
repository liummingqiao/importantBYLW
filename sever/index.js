const express = require("express")

const app = express()


app.set('secret','qioashen456789')

app.use(require('cors')())//引入跨域模块
app.use(express.json())
app.use('/', express.static(__dirname + '/web'))
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use('/admin', express.static(__dirname + '/admin'))

require('./plugins/db')(app)//单独建立一个引入的模块以 mongoose的链接
require('./routes/admin')(app)//mongoose的初始化
require('./routes/web')(app)//mongoose的初始化


app.listen(3000, () => {
    console.log('http://localhost:3000');
})