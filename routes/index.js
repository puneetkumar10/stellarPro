var express = require('express');
var router = express.Router();
var stellarService = require("../service/stellarService");
var responseService = require("../service/responseService");
var url = require('url');

// api for creating a wallet (POST)
router.post("/wallet", (req, res) => {
  stellarService.createWallet((err, result) => {
    if (err)
      responseService.response(req, err, null, res);
    else
      responseService.response(req, null, result, res);
  });
});


router.get("/balance", (req, res) => {
  var q = url.parse(req.url, true).query;
  var pubKey = q.pubKey;
  stellarService.checkBalance(pubKey, (err, result) => {
    if (err)
      responseService.response(req, err, null, res);
    else
      responseService.response(req, null, result, res);
  });
});

// api for creating a transaction (POST)
router.post("/transaction", (req, res) => {
  var q = req.body;
  var data = {
    senderPriKey : q.senderPriKey,
    receiverPriKey : q.receiverPriKey,
    amount : q.amount
  }
  stellarService.TransferAsset(data, (err, result) => {
    if (err)
      responseService.response(req, err, null, res);
    else
      responseService.response(req, null, result, res);
  });
});

// api for issuing new tokens (POST)
router.post("/issuetoken", (req, res) => {
  var q = req.body;
  var data = {
    issuerPriKey : q.issuerPriKey,
    receiverPriKey : q.receiverPriKey,
    amount : q.amount
  }
  stellarService.issueToken(data, (err, result) => {
    if (err)
      responseService.response(req, err, null, res);
    else
      responseService.response(req, null, result, res);
  });
});


module.exports = router;
