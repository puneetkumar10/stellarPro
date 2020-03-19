var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var transactionModel = new Schema({
    id:ObjectId,
    req:Object,
    transactionDetails:Object,    
    transactionDate:{type:Date ,
    default:Date.now}
});
module.exports = mongoose.model('transactionModel',transactionModel);