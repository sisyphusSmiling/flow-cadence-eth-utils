// document.getElementById('signButton').addEventListener('click', signMessageWithMetaMask);
const ethers = require('ethers');
// Import the entire ethereumjs-util module
const {
    ecrecover,
    toBuffer,
    pubToAddress,
} = require('@ethereumjs/util');
// import * as ethereumjs from '@ethereumjs/util';

document.getElementById('signButton').addEventListener('click', signMessageWithMetaMask);

async function signMessageWithMetaMask() {
    // Check if MetaMask is installed
    if (!window.ethereum) {
        alert('Please install MetaMask first.');
        return;
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        // Get the message from the input field
        const message = document.getElementById('messageInput').value;
        if (!message) {
            alert('Please enter a message to sign.');
            return;
        }

        // Sign the message
        const signature = await signer.signMessage(message);

        // Output the results
        console.log('Message:', message);
        console.log('Signature:', signature);
        console.log('Signer Address:', address);

        // Display the results on the webpage
        document.getElementById('message').textContent = message;
        document.getElementById('signature').textContent = signature;
        document.getElementById('address').textContent = address;

        // Recover the public key using ethereumjs-util
        const messageHash = ethers.utils.hashMessage(message);
        const msgHashUint8Array = Uint8Array.from(Buffer.from(ethers.utils.arrayify(messageHash)));
        const signatureParams = ethers.utils.splitSignature(signature);
        const vBigInt = BigInt(signatureParams.v);
        const rUint8Array = Uint8Array.from(Buffer.from(signatureParams.r.slice(2), 'hex'));
        const sUint8Array = Uint8Array.from(Buffer.from(signatureParams.s.slice(2), 'hex'));

        const publicKey = ecrecover(msgHashUint8Array, vBigInt, rUint8Array, sUint8Array);
        // const publicKeyString = bufferToHex(Buffer.from(publicKey));
        const publicKeyString = '0x' + Buffer.from(publicKey).toString('hex');

        // Display the public key
        document.getElementById('publicKey').textContent = publicKeyString;

        // Display the public key
        document.getElementById('publicKey').textContent = publicKeyString;

    } catch (err) {
        console.error(err);
        alert('An error occurred during the message signing process.');
    }
}
