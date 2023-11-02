// document.getElementById('signButton').addEventListener('click', signMessageWithMetaMask);
const ethers = require('ethers');
// Import the entire ethereumjs-util module
const {
    ecrecover,
    toBuffer,
    pubToAddress,
} = require('@ethereumjs/util');
const fcl = require('@onflow/fcl');
const {
    network,
    fclConfigInfo,
    updateAuthUI
} = require('./utils.js');

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('signButton').addEventListener('click', signMessageWithMetaMask);
    document.getElementById('loginButton').addEventListener('click', authenticateWithFlow);
    document.getElementById('logoutButton').addEventListener('click', unauthenticateWithFlow);
});


// const fclConfigInfo = {
//     emulator: {
//         accessNode: 'http://127.0.0.1:8888',
//         discoveryWallet: 'http://localhost:8701/fcl/authn',
//         discoveryAuthInclude: []
//     },
//     testnet: {
//         accessNode: 'https://rest-testnet.onflow.org',
//         discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
//         discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/testnet/authn',
//         // Adds in Dapper + Ledger
//         discoveryAuthInclude: ["0x82ec283f88a62e65", "0x9d2e44203cb13051"]
//     },
//     mainnet: {
//         accessNode: 'https://rest-mainnet.onflow.org',
//         discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
//         discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/authn',
//         // Adds in Dapper + Ledger
//         discoveryAuthInclude: ["0xead892083b3e2c6c", "0xe5cd26afebe62781"]
//     }
// };

// const network = 'emulator';

fcl.config({
    "app.detail.title": "Flow Affiliated Accounts", // the name of your DApp
    "app.detail.icon": "https://assets-global.website-files.com/5f734f4dbd95382f4fdfa0ea/63ce603ae36f46f6bb67e51e_flow-logo.svg", // your DApps icon
    "flow.network": network,
    "accessNode.api": fclConfigInfo[network].accessNode,
    "discovery.wallet": fclConfigInfo[network].discoveryWallet,
    "discovery.authn.endpoint": fclConfigInfo[network].discoveryAuthnEndpoint,
    // adds in opt-in wallets like Dapper and Ledger
    "discovery.authn.include": fclConfigInfo[network].discoveryAuthInclude
});

// Initialize user state
let user = { loggedIn: false, addr: "" };

// Subscribe to user changes
fcl.currentUser().subscribe((currentUser) => {
    user = currentUser;
    updateAuthUI(user);
});

// // Update UI based on authentication state
// function updateAuthUI() {
//     const loginButton = document.getElementById('loginButton');
//     const logoutButton = document.getElementById('logoutButton');
//     const userAddress = document.getElementById('userAddress');

//     if (user.loggedIn) {
//         loginButton.style.display = 'none';
//         logoutButton.style.display = 'block';
//         userAddress.textContent = `Welcome, ${user.addr}!`;
//     } else {
//         loginButton.style.display = 'block';
//         logoutButton.style.display = 'none';
//         userAddress.textContent = 'Please log in.';
//     }
// }

// Authenticate with Flow
async function authenticateWithFlow() {
    await fcl.authenticate();
}

// Unauthenticate with Flow
function unauthenticateWithFlow() {
    fcl.unauthenticate();
}

async function signMessageWithMetaMask() {
    // Check if MetaMask is installed
    if (!window.ethereum) {
        alert('Please install MetaMask first.');
        return;
    }

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

        // Send a request to access the user's Ethereum accounts
        await provider.send("eth_requestAccounts", []);

        const signer = provider.getSigner();
        const signerAddress = (await signer.getAddress()).toLowerCase();

        // Define a string message to be signed
        const user = await fcl.authenticate()
        const message = `${user.addr}:${signerAddress}`

        const ethSig = await signer.signMessage(message);

        // Remove the '0x' prefix from the signature string
        const removedPrefix = ethSig.replace(/^0x/, '');

        // Construct the sigObj object that consists of the following parts
        let sigObj = {
            r: removedPrefix.slice(0, 64),  // first 32 bytes of the signature
            s: removedPrefix.slice(64, 128),  // next 32 bytes of the signature
            recoveryParam: parseInt(removedPrefix.slice(128, 130), 16),  // the final byte (called v), used for recovering the public key
        };

        // Combine the 'r' and 's' parts to form the full signature
        const signature = sigObj.r + sigObj.s;

        // Construct the Ethereum signed message, following Ethereum's \x19Ethereum Signed Message:\n<length of message><message> convention.
        // The purpose of this convention is to prevent the signed data from being a valid Ethereum transaction
        const ethMessageVersion = `\x19Ethereum Signed Message:\n${message.length}${message}`;

        // Compute the Keccak-256 hash of the message, which is used to recover the public key
        const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ethMessageVersion));

        const pubKeyWithPrefix = ethers.utils.recoverPublicKey(messageHash, ethSig);

        // Remove the prefix of the recovered public key
        const publicKey = pubKeyWithPrefix.slice(4);

        // The pubKey, toSign, and signature can now be used to interact with Cadence
        // Display the results on the webpage
        console.log(`Signed message: ${message}`);
        console.log(`Signature: ${signature}`);
        console.log(`Signer address: ${signerAddress}`);
        console.log(`Signer public key: ${publicKey}`);

    } catch (err) {
        console.error(err);  // Log any errors
    }
}

async function verifySignature() {
    const signerAddress = document.getElementById('verifyAddressInput').value.trim();
    const originalMessage = document.getElementById('verifyMessageInput').value.trim();
    const signature = document.getElementById('verifySignatureInput').value.trim();
    const verificationResultElement = document.getElementById('verificationResult');

    if (!signerAddress || !originalMessage || !signature) {
        alert('Please enter the signer address, the original message, and the signature.');
        return;
    }

    try {
        // Ensure the signature includes the 'v' value
        if (signature.length !== 132) {
            throw new Error('The signature is not the correct length.');
        }

        // Extract the 'v' value from the signature
        const r = signature.slice(0, 66);
        const s = '0x' + signature.slice(66, 130);
        const v = '0x' + signature.slice(130, 132);

        // Construct a full signature object expected by ethers
        const fullSignature = {
            r: r,
            s: s,
            v: parseInt(v, 16)
        };

        // Hash the original message in the same way it was hashed during signing
        const messageHash = ethers.hashMessage(originalMessage);
        const messageHashBytes = ethers.arrayify(messageHash);

        // Recover the address from the signature
        const recoveredAddress = ethers.recoverAddress(messageHashBytes, fullSignature);

        if (recoveredAddress.toLowerCase() === signerAddress.toLowerCase()) {
            verificationResultElement.textContent = 'Signature is valid.';
            verificationResultElement.style.color = 'green';
        } else {
            verificationResultElement.textContent = 'Signature is invalid.';
            verificationResultElement.style.color = 'red';
        }
    } catch (err) {
        console.error('Error during FCL authentication or MetaMask signing:', err);
        verificationResultElement.textContent = 'An error occurred during the verification process.';
        verificationResultElement.style.color = 'red';
    }
}
