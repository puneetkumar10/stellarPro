
var StellarSdk = require("stellar-sdk");
const fetch = require("node-fetch");
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

// API to create account and add lumens in it.
exports.createWallet = async (next) => {
    // create a completely new and unique pair of keys
    // see more about KeyPair objects: https://stellar.github.io/js-stellar-sdk/Keypair.html
    const pair = StellarSdk.Keypair.random();
    publicKey = pair.publicKey();
    secretKey = pair.secret();
    try {
        const response = await fetch(
            `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
        );
        const responseJSON = await response.json();
        console.log("SUCCESS! You have a new account :)\n", responseJSON);
        var data = {
            responseJSON: responseJSON,
            publicKey: publicKey,
            secretKey: secretKey
        }
        next(null, data);
    } catch (error) {
        console.error("ERROR!", error);
        next(error, null);
    }
}

// API to check balance
exports.checkBalance = async (pubKey, next) => {
    // the JS SDK uses promises for most actions, such as retrieving an account   
    try {
        const account = await server.loadAccount(pubKey);
        console.log("Balances for account: " + pubKey);
        // account.balances.forEach(function(balance) {
        //     console.log("Type:", balance.asset_type, ", Balance:", balance.balance);
        // });
        next(null, account.balances);
    } catch (error) {
        next(error, null);
    }
}

//API for transaction
exports.CreateTransaction = (data, next) => {
    // var StellarSdk = require('stellar-sdk');
    StellarSdk.Network.useTestNetwork();
    // var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    var sourceKeys = StellarSdk.Keypair
        .fromSecret(data.senderPriKey);
    var destKeys = StellarSdk.Keypair
        .fromSecret(data.receiverPriKey);
    var destinationId = destKeys.publicKey();
    // Transaction will hold a built transaction we can resubmit if the result is unknown.
    var transaction;

    // First, check to make sure that the destination account exists.
    // You could skip this, but if the account does not exist, you will be charged
    // the transaction fee when the transaction fails.
    server.loadAccount(destinationId)
        // If the account is not found, surface a nicer error message for logging.
        .catch(StellarSdk.NotFoundError, function (error) {
            throw new Error('The destination account does not exist!');
        })
        // If there was no error, load up-to-date information on your account.
        .then(function () {
            return server.loadAccount(sourceKeys.publicKey());
        })
        .then(function (sourceAccount) {
            // Start building the transaction.
            // transaction = new StellarSdk.TransactionBuilder(sourceAccount, opts={fee:100})
            //     .addOperation(StellarSdk.Operation.payment({ destination: destinationId, asset: StellarSdk.Asset.native(), amount: "1" })) .build()
            transaction = new StellarSdk.TransactionBuilder(sourceAccount, opts = { fee: 100 })
                .addOperation(StellarSdk.Operation.payment({
                    destination: destinationId,
                    // Because Stellar allows transaction in many currencies, you must
                    // specify the asset type. The special "native" asset represents Lumens.
                    asset: StellarSdk.Asset.native(),
                    amount: data.amount
                }))
                // A memo allows you to add your own metadata to a transaction. It's
                // optional and does not affect how Stellar treats the transaction.
                .addMemo(StellarSdk.Memo.text('Test Transaction'))
                // Wait a maximum of three minutes for the transaction
                .setTimeout(180)
                .build();
            // Sign the transaction to prove you are actually the person sending it.
            transaction.sign(sourceKeys);
            // And finally, send it off to Stellar!
            return server.submitTransaction(transaction);
        })
        .then(function (result) {
            console.log('Success! Results:', result);
            next(null, result);
        })
        .catch(function (error) {
            console.error('Something went wrong!', error);
            // If the result is unknown (no response body, timeout etc.) we simply resubmit
            // already built transaction:
            // server.submitTransaction(transaction);
            next(error, null);
        });
}

exports.issueToken = async (data, next) => {
    StellarSdk.Network.useTestNetwork();
    var issuingKeys = StellarSdk.Keypair
        .fromSecret(data.issuerPriKey);
    var receivingKeys = StellarSdk.Keypair
        .fromSecret(data.receiverPriKey);

    // Create an object to represent the new asset
    var astroDollar = new StellarSdk.Asset('PuneetToken', issuingKeys.publicKey());

    // code for check of trustability
    var astroDollarCode = 'PuneetToken';
    var astroDollarIssuer = issuingKeys.publicKey();
    var accountId = receivingKeys.publicKey();
    server.loadAccount(accountId).then(function (account) {
        var trusted = account.balances.some(function (balance) {
            return balance.asset_code === astroDollarCode &&
                balance.asset_issuer === astroDollarIssuer;
        });

        console.log(trusted ? 'Trusted :)' : 'Not trusted :(');
    });

    // First, the receiving account must trust the asset
    await server.loadAccount(receivingKeys.publicKey())
        .then(function (receiver) {
            var transaction = new StellarSdk.TransactionBuilder(receiver, opts = { fee: 100 })
                // The `changeTrust` operation creates (or alters) a trustline
                // The `limit` parameter below is optional
                .addOperation(StellarSdk.Operation.changeTrust({
                    asset: astroDollar,
                    limit: '1000'
                }))
                // setTimeout is required for a transaction
                .setTimeout(100)
                .build();
            transaction.sign(receivingKeys);
            return server.submitTransaction(transaction);
        })

        // Second, the issuing account actually sends a payment using the asset
        .then(function () {
            return server.loadAccount(issuingKeys.publicKey())
        })
        .then(function (issuer) {
            var transaction = new StellarSdk.TransactionBuilder(issuer, opts = { fee: 100 })
                .addOperation(StellarSdk.Operation.payment({
                    destination: receivingKeys.publicKey(),
                    asset: astroDollar,
                    amount: data.amount
                }))
                // setTimeout is required for a transaction
                .setTimeout(100)
                .build();
            transaction.sign(issuingKeys);
            return server.submitTransaction(transaction);
        })
        .then(function (result) {
            console.log('Success! Results:', result);
            next(null, result);
        })
        .catch(function (error) {
            console.error('Error!', error);
            next(error, null);
        });
}

exports.TransferAsset = async (data, next) => {
    StellarSdk.Network.useTestNetwork();
    // Prepare keypairs for all participating accounts - source account and destination account.
    let source = StellarSdk.Keypair.fromSecret(data.senderPriKey)
    let dest = StellarSdk.Keypair.fromSecret(data.receiverPriKey)

    // Transactions require a valid sequence number that is specific to this account.
    // We can fetch the current sequence number for the source account from Horizon.
    const account = await server.loadAccount(source.publicKey());

    // Right now, there's one function that fetches the base fee.
    // In the future, we'll have functions that are smarter about suggesting fees,
    // e.g.: `fetchCheapFee`, `fetchAverageFee`, `fetchPriorityFee`, etc.
    const fee = await server.fetchBaseFee();

    // First, the receiving account must trust the asset
    await server.loadAccount(dest.publicKey())
        .then(function (receiver) {
            var transaction = new StellarSdk.TransactionBuilder(receiver, opts = { fee: 100 })
                // The `changeTrust` operation creates (or alters) a trustline
                // The `limit` parameter below is optional
                .addOperation(StellarSdk.Operation.changeTrust({
                    asset: new StellarSdk.Asset('PuneetToken', 'GAQPXWS4JKOXGDO5J2VDZCKNPQ2AAMMTDDGVJWWI2Q3OE2CE2NZLTHAM'),
                    limit: '1000'
                }))
                // setTimeout is required for a transaction
                .setTimeout(100)
                .build();
            transaction.sign(dest);
            return server.submitTransaction(transaction);
        })

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee,
        // Uncomment the following line to build transactions for the live network. Be
        // sure to also change the horizon hostname.
        // networkPassphrase: StellarSdk.Networks.PUBLIC,
        networkPassphrase: StellarSdk.Networks.TESTNET
    })
        // Add a payment operation to the transaction
        .addOperation(StellarSdk.Operation.payment({
            destination: dest.publicKey(),
            // The term native asset refers to lumens
            asset: new StellarSdk.Asset('PuneetToken', 'GAQPXWS4JKOXGDO5J2VDZCKNPQ2AAMMTDDGVJWWI2Q3OE2CE2NZLTHAM'),
            // Specify 350.1234567 lumens. Lumens are divisible to seven digits past
            // the decimal. They are represented in JS Stellar SDK in string format
            // to avoid errors from the use of the JavaScript Number data structure.
            amount: '20',
        }))
        // Make this transaction valid for the next 30 seconds only
        .setTimeout(30)
        // Uncomment to add a memo (https://www.stellar.org/developers/learn/concepts/transactions.html)
        // .addMemo(StellarSdk.Memo.text('Hello world!'))
        .build();

    // Sign this transaction with the secret key
    // NOTE: signing is transaction is network specific. Test network transactions
    // won't work in the public network. To switch networks, use the Network object
    // as explained above (look for StellarSdk.Network).
    transaction.sign(source);

    // Let's see the XDR (encoded in base64) of the transaction we just built
    console.log(transaction.toEnvelope().toXDR('base64'));

    // Submit the transaction to the Horizon server. The Horizon server will then
    // submit the transaction into the network for us.
    try {
        const transactionResult = await server.submitTransaction(transaction);
        console.log(JSON.stringify(transactionResult, null, 2));
        console.log('\nSuccess! View the transaction at: ');
        console.log(transactionResult._links.transaction.href);
    } catch (e) {
        console.log('An error has occured:');
        console.log(e);
    }
}