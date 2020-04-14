module.exports = options => {
    const jwt = require('jsonwebtoken')
    const assert = require('http-assert')
    const AdminUser = require('../models/AdminUser')
    return async (req, res, next) => {
        const token = String(req.headers.authorization || '').split(' ').pop()
        assert(token, 401, 'No have token')
        const { id } = jwt.verify(token, req.app.get('secret'))
        assert(id, 401, 'token have err')
        req.user = await AdminUser.findById(id)
        assert(req.user, 401, 'Pleace login first ')
        console.log(req.user)
        await next()
    }
}