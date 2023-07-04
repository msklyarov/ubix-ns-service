const factory = require('chain-in-law');
const commandLineArgs = require('command-line-args');

const CilUtils = require('./cilUtils');
const Config = require('./config');

// Читаем опции
const options = readCmdLineOptions();

const {CONCILIUM_ID} = process.env;

/**
 *
 * @param {Wallet} wallet
 * @param {Array} arrUtxos - [{"hash", "nOut", "amount","isStable"}]
 * @returns {*}
 */
function callContract(wallet, arrUtxos, objInvokeCode) {
    const {CONTRACT_ADDR} = process.env;

    // todo: change here
    //   const tx = factory.Transaction.createContract(createContractCode(), wallet.address);
    const tx = factory.Transaction.invokeContract(CONTRACT_ADDR, objInvokeCode, 180000, wallet.address);

    tx.conciliumId = CONCILIUM_ID;

    for (let utxo of arrUtxos) {
        console.log(`Using UTXo ${utxo.hash} idx ${utxo.nOut}`);
        tx.addInput(utxo.hash, utxo.nOut);
    }

    // SIGN it! to rule it!
    tx.signForContract(wallet.privateKey);

    return tx;
}

function readCmdLineOptions() {
    const {RPC_ADDRESS, RPC_PORT, RPC_USER = '', PRC_PASS = '', API_URL} = Config;

    const optionDefinitions = [
        {name: 'rpcAddress', type: String, multiple: false, defaultValue: RPC_ADDRESS},
        {name: 'rpcPort', type: Number, multiple: false, defaultValue: RPC_PORT},
        {name: 'rpcUser', type: String, multiple: false, defaultValue: RPC_USER},
        {name: 'rpcPass', type: String, multiple: false, defaultValue: PRC_PASS},
        {name: 'fundsPk', type: String, multiple: false},
        {name: 'receiverAddr', type: String, multiple: false},
        {name: 'justCreateTx', type: Boolean, multiple: false, defaultValue: false},
        {name: 'utxo', type: String, multiple: true},
        {name: 'apiUrl', type: String, multiple: false, defaultValue: API_URL},
        {name: 'amountHas', type: Number, multiple: false}
    ];
    return commandLineArgs(optionDefinitions, {camelCase: true});
}

const confirm = async (provider, userName) => {
    const {PRIVATE_KEY: fundsPk} = process.env;

    const wallet = new factory.Wallet(fundsPk);

    const cilUtils = new CilUtils({
        ...options,
        privateKey: fundsPk
    });

    await cilUtils.asyncLoaded();

    const arrUtxos = await cilUtils.getUtxos(wallet.address);

    const {arrCoins} = cilUtils.gatherInputsForContractCall(arrUtxos, 180000);

    const objInvokeCode = {
        method: 'verify',
        arrArguments: [provider, userName]
    };

    const tx = callContract(wallet, arrCoins, objInvokeCode);
    console.error(
        `Here is TX containment: ${JSON.stringify(CilUtils.prepareForStringifyObject(tx.rawData), undefined, 2)}`
    );

    //    console.error('------------ Tx wasnt sent: uncomment below -------------');
    await cilUtils.sendTx(tx);
};

module.exports = confirm;
