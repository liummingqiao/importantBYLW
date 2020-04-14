const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    name: { type: String },
    avatar: { type: String },
    banner:{ type: String },
    title:{type:String},
    categories:[{ type: mongoose.SchemaTypes.ObjectId, ref: 'Category'}],
    scores:{
        difficult :{ type : Number },
        skills :{type:Number},
        attack:{type:Number },
        survive :{type:Number},
    },
    skills: [{
        icon: { type: String },
        name: { type: String },
        descreption : { type: String},
        tips :{ type: String  }
    }],
    item1:[{ type:mongoose.SchemaTypes.ObjectId, ref:'Item'}],//Downwind equipment 
    item2:[{ type:mongoose.SchemaTypes.ObjectId, ref:'Item'}],//Upwind equipment
    usageTips:{ type: String },
    battleTips:{type: String},
    teamTips:{type:String,},
    partners:[{
        hero:{type:mongoose.SchemaTypes.ObjectId,ref:'Hero'},
        descreption:{type:String},
    }],
})

module.exports = mongoose.model('Hero', schema,'herose') 