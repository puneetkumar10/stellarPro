var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var walletCreation = new Schema({
    id:ObjectId,
    req:String,
    walletCreds:Object,    
    createDate:{type:Date ,
    default:Date.now}
});
module.exports = mongoose.model('walletCreation',walletCreation);