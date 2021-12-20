// Llamada a las dependencias del proyecto
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const fetch = require('node-fetch');

// Llamada a los archivos .json
const contractJson = require('../build/contracts/Oracle.json');

// Instancia de web3
const web3 = new Web3('ws://127.0.0.1:8545');

// Información de direcciones de Ganache
const addressContract = '0xd15D65eeaEe7309C4B88055CA82bc43775a092b7';
const contractInstance = new web3.eth.Contract(contractJson.abi, addressContract);

const privateKey = Buffer.from('c9cd60803ff492795a0f90ebf4a09b3f99bec55add11329e54eb4b000086cc8c', 'hex');
const address = '0xea50eAC2e899c326a5B1cc6441140ab656ACAF98';

// Obtener el número de bloque
web3.eth.getBlockNumber().then(n => listenEvent(n-1));

// Función: listenEvent
function listenEvent(lastBlock) {
    contractInstance.events.__callbackNewData({}, {fromBlock: lastBlock, toBlock: 'latest'}, (err,event) => {
        event ? updateData() : null;
        err ? console.log(err) : null;
    });
}

// Funcion: updateData
function updateData() {
    // start_date = 2015-09-07
    // end_date = 2015-09-08
    // api_key = DEMO_KEY
    const url = 'https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY';

    fetch(url)
    .then(response => response.json())
    .then(json => setDataContract(json.element_count));
}

// Funcion: setDataContract(_value)
function setDataContract(_value) {
    web3.eth.getTransactionCount(address, (err, txNum) => {
        contractInstance.methods.setNumberAsteroids(_value)
            .estimateGas({}, (err, gasAmount) => {
                let rawTx = {
                    nonce: web3.utils.toHex(txNum),
                    gasPrice: web3.utils.toHex(web3.utils.toWei('1.4', 'gwei')),
                    gasLimit: web3.utils.toHex(gasAmount),
                    to: addressContract,
                    value : '0x00',
                    data: contractInstance.methods.setNumberAsteroids(_value).encodeABI()
                } 

                const tx = new Tx(rawTx);
                tx.sign(privateKey);
                const serializedTx = tx.serialize().toString('hex');
                web3.eth.sendSignedTransaction('0x' + serializedTx)
            });
    });
}