module.exports = options => {
    return async (req, res, next) => {
        const modelName = require('inflection').classify(req.params.resource)
        // return res.send({modelName})
        req.Model = require(`../models/${modelName}`)
        next()
    }

}