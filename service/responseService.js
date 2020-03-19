var walletService = require('./walletCreationMongo');
var transactionService = require('./transactionMongo')


module.exports.response = (req, err, data, res) => {
    if (err)
        res.status(200).json({ status: 0, message: err, data: {} });
    else {
        res.status(200).json({ status: 1, message: 'Success', data: data });
        if (req.originalUrl == "/stellar/wallet") {
            let response_obj = { status: 1, message: 'Success', data: data };
            let request_obj = { url: req.originalUrl, method: req.method, time: new Date() };
            walletService.createRecord(JSON.stringify(request_obj), JSON.stringify(response_obj));
        }
        else if (req.originalUrl == "/stellar/transaction" || req.originalUrl == "/stellar/issuetoken") {
            let response_obj = { status: 1, message: 'Success', data: data };
            let request_obj = { url: req.originalUrl, method: req.method, time: new Date() };
            transactionService.createRecord(JSON.stringify(request_obj), response_obj);
        }
    }
};