"use strict";
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const grpc = __importStar(require("@grpc/grpc-js"));
const fabric_gateway_1 = require("@hyperledger/fabric-gateway");
const crypto = __importStar(require("crypto"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const util_1 = require("util");
const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'asset-transfer-basic-TypeScript');
const mspId = envOrDefault('MSP_ID', 'org0-example-com');
// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'mywork', 'vars', 'keyfiles', 'peerOrganizations', 'org0.example.com'));
// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));
// Path to user certificate.
const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem'));
// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));
// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7002');
// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer1.org0.example.com');
const utf8Decoder = new util_1.TextDecoder();
const DateNow = new Date();
//------------------------------------------------------------------------------
//Declaration for the User Input
const prompt = require('prompt-sync')();
var ApprovedBy;
var CurrentSchool;
var DateSubmited;
var SerializedTFile;
var StudentID;
var StudentName;
var RequestingSchool;
//------------------------------------------------------------------------------
//Declarations for generated Input
var assetId;
var DateRequested = DateNow.toLocaleString();
var DateSubmited = DateNow.toLocaleString();
//------------------------------------------
async function main() {
    //await displayInputParameters();
    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();
    const gateway = (0, fabric_gateway_1.connect)({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });
    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);
        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);
        var key = '0';
        console.log(`This is an Example of an application interacting with the Secure Transcript Ledger chaincode`);
        console.log('Welcome to the Transcript Central.\nPlease choose an option');
        console.log('1. Request Transcript');
        console.log('2. Submit Transcript');
        console.log('3. Search Request');
        console.log('4. Delete Request');
        console.log('5. Get All Requests');
        key = prompt();
        if (key == '1') {
            assetId = `asset${Date.now()}`;
            console.log(`What's your name?`);
            StudentName = prompt();
            console.log(`\nHey there ${StudentName}`);
            console.log(`\nWhat is your SID?`);
            StudentID = prompt();
            console.log(`\nEnter Current School`);
            CurrentSchool = prompt();
            console.log(`\nRequesting School`);
            RequestingSchool = prompt();
            DateSubmited = '0';
            SerializedTFile = '0';
            ApprovedBy = '0';
            // Create a new asset on the ledger.
            await createAsset(contract, assetId);
            gateway.close();
            client.close();
        }
        else if (key == '2') {
            // Update an existing asset asynchronously.
            console.log('Who Approved this transcript');
            ApprovedBy = prompt();
            console.log('Enter the transaction id to upload the file');
            assetId = prompt();
            await transferAssetAsync(contract, assetId);
            gateway.close();
            client.close();
        }
        else if (key == '3') {
            // Get the asset details by assetID.
            await readAssetByID(contract);
            gateway.close();
            client.close();
        }
        else if (key == '4') {
            //Delete Request from the ledger
            console.log('Enter the transaction id to delete the request');
            assetId = prompt();
            await deleteRequest(contract, assetId);
            gateway.close();
            client.close();
        }
        else if (key == '5') {
            // Return all the current assets on the ledger.
            await GetAllAssets(contract);
            gateway.close();
            client.close();
        }
        else {
            gateway.close();
            client.close();
        }
    }
    finally {
        gateway.close();
        client.close();
    }
}
main().catch(error => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});
async function newGrpcConnection() {
    const tlsRootCert = await fs_1.promises.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}
async function newIdentity() {
    const credentials = await fs_1.promises.readFile(certPath);
    return { mspId, credentials };
}
async function newSigner() {
    const files = await fs_1.promises.readdir(keyDirectoryPath);
    const keyPath = path.resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs_1.promises.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return fabric_gateway_1.signers.newPrivateKeySigner(privateKey);
}
/**
 * Evaluate a transaction to query ledger state.
 */
async function GetAllAssets(contract) {
    console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
    const resultBytes = await contract.evaluateTransaction('GetAllAssets');
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}
/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createAsset(contract, transactionID) {
    console.log('\nYour Transcript Request is processing with the information provided.');
    transactionID = assetId;
    await contract.submitTransaction('CreateAsset', assetId, ApprovedBy, CurrentSchool, DateRequested, DateSubmited, RequestingSchool, SerializedTFile, StudentID, StudentName);
    console.log('*** Request processed successfuly***');
    console.log(`*** Your transaction ID is ${assetId}`);
}
async function deleteRequest(contract, transactionID) {
    console.log('\n--> Delete Transaction: DeleteAsset, function deletes the specified asset on the ledger');
    transactionID = assetId;
    await contract.submitTransaction('DeleteAsset', assetId);
    console.log('***Request processed successfuly**');
    console.log('***Asset Deleted**');
}
/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
async function transferAssetAsync(contract, transactionID) {
    console.log('\n--> Async Submit Transaction: UpdateAsset, will update the block with the file, who authorized, and what time');
    transactionID = assetId;
    const commit = await contract.submitAsync('UpdateAsset', {
        arguments: [
            assetId,
            ApprovedBy,
            'Bergen Community College',
            DateRequested,
            DateSubmited,
            'Stevens Institute of Technology',
            'SerializedTFile',
            '086226',
            'Rene Bulnes'
        ],
    });
    //const oldOwner = utf8Decoder.decode(commit.getResult());
    //console.log(`*** Successfully submitted transaction to transfer ownership from ${oldOwner} to Saptha`);
    console.log('*** Waiting for transaction commit');
    const status = await commit.getStatus();
    if (!status.successful) {
        throw new Error(`Transaction ${status.transactionId} failed to commit with status code ${status.code}`);
    }
    console.log('*** Transaction committed successfully');
}
async function readAssetByID(contract) {
    console.log('\n--> Evaluate Transaction: ReadAsset, function returns asset attributes');
    console.log('Enter the transaction ID');
    assetId = prompt();
    const resultBytes = await contract.evaluateTransaction('ReadAsset', assetId);
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}
/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}
/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters() {
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certPath:          ${certPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}
//# sourceMappingURL=app.js.map