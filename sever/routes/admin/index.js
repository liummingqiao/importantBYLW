module.exports = app => {
    const express = require('express')
    // const jwt = require('jsonwebtoken')
    const assert = require('http-assert')
    const AdminUser = require('../../models/AdminUser')
    const router = express.Router({
        mergeParams: true
    })
    // const req.Model = require('../../models/req.Model')
    //创建资源
    router.post('/', async (req, res) => {
        const model = await req.Model.create(req.body)
        res.send(model)
    })
    router.put('/:id', async (req, res) => {
        const model = await req.Model.findByIdAndUpdate(req.params.id, req.body)
        res.send(model)
    })
    router.delete('/:id', async (req, res) => {
        await req.Model.findByIdAndDelete(req.params.id, req.body)
        res.send({
            success: true
        })
    })
    //资源列表
    // const authmiddleware = require('../../middleware/auth')
    const resultmiddleware = require('../../middleware/result')
    router.get('/', async (req, res, next) => {
        // const token = String(req.headers.authorization || '').split(' ').pop()
        // assert(token, 401, 'No have token')
        // const { id } = jwt.verify(token, app.get('secret'))
        // assert(id, 401, 'token have err')
        // req.user = await AdminUser.findById(id)
        // assert(req.user, 401, 'Pleace login first ')
        // console.log(req.user)
        await next()
    }, async (req, res) => {

        const items = await req.Model.find().populate('parent').limit(100)
        res.send(items)
    })
    router.get('/:id', async (req, res) => {
        const model = await req.Model.findById(req.params.id)
        res.send(model)
    })

    app.use('/admin/api/rest/:resource/',resultmiddleware(), router)

    const multer = require('multer')
    const upload = multer({ dest: __dirname + '/../../uploads' })
    app.post('/admin/api/upload',upload.single('file'), async (req, res) => {
        const file = req.file
        file.url = `http://localhost:3000/uploads/${file.filename}`
        res.send(file)
    })

    app.post('/admin/api/login', async (req, res) => {

        const { username, password } = req.body
        const user = await AdminUser.findOne({
            username: username
        }).select('+password')
        assert(user, 422, '用户不存在')
        // if (!user) {
        //     return res.status(422).send({
        //         message: "用户不存在"
        //     })
        // }

        const isVaild = require('bcrypt').compareSync(password, user.password)
        if (!isVaild) {
            return res.status(422).send({
                message: "密码错误"
            })
        }

        // const token = jwt.sign({ id: user._id }, app.get('secret'))
        // res.send({ token })
    })
    //错误处理
    app.use(async (err, req, res, next) => {
        res.status(err.statusCode || 500).send({
            message: err.message
        })
    })
}