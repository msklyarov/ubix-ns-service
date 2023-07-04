const express = require('express');
const elliptic = require('elliptic');

const confirm = require('./utils/confirm');

const ec = new elliptic.ec('secp256k1');
const app = express();

const {PUBLIC_KEY: strPublicKey, PRIVATE_KEY: strPrivateKey} = process.env;

app.use(express.json());

app.get('/verify/:provider/:address', async (req, res) => {
    const {provider, address} = req.params;
    const {signedCode} = req.query;

    try {
        // const bResult = ec.verify(
        //     `${provider}:${address}`,
        //     JSON.parse(Buffer.from(signedCode, 'base64').toString('binary')),
        //     strPublicKey,
        //     'hex'
        // );

        // if (!bResult) {
        //     res.json({success: false, error: 'Wrong verification code'});
        // }

        // call verify contract here
        await confirm(provider, address);
    } catch (e) {
        res.json({success: false, error: e.toString()});
    }
});

app.listen(process.env.PORT || 3000);
