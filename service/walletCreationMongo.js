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
    var walletCreationModel = mongoose.model('walletCreation');
    var walletCreationRecord = new walletCreationModel()
    walletCreationRecord.req = req_param;
    walletCreationRecord.walletCreds = res_param;
    walletCreationRecord.save((err, data) => {
        if (err)
            next(err, null);
        else
            next(null, data);
    })
}
