var mongoose = require('mongoose');

exports.createRecord = (req, res) => {
    module.exports.saveRecord(req, res, (error) => {
        if (error) {
            console.log('data not stored because of error:  ');
        }
        else {
            console.log('data successfully stored');
        }
    })
}

exports.saveRecord = (req_param, res_param, next) => {
    var transactionModel = mongoose.model('transactionModel');
    var transactionModelRecord = new transactionModel()
    transactionModelRecord.req = req_param;
    transactionModelRecord.transactionDetails = res_param;
    transactionModelRecord.save((err, data) => {
        if (err)
            next(err, null);
        else
            next(null, data);
    })
}
