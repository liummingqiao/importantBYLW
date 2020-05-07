const mongoose = require('mongoose')

const schema = new mongoose.Schema({
        name:{type:String},
        lat: { type: Number },
        lng: { type: Number }
})

module.exports = mongoose.model('Ad', schema) 