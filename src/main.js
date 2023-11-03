const ethers = require('ethers');
const fcl = require('@onflow/fcl');
const {
    network,
    fclConfigInfo,
    updateAuthUI
} = require('./utils.js');
const {
    CREATE_ATTESTATION,
    GET_ATTESTED_ADDRESSES_WITH_STATUS,
    REMOVE_ATTESTATIONS
} = require('./cadence.js')
const flowJSON = require('../flow.json');

document.addEventListener('DOMContentLoaded', async (event) => {

    // Subscribe to user state changes
    fcl.currentUser().subscribe(async (currentUser) => {
        user = currentUser;
        updateAuthUI(user);

        // If the user is logged in, fetch their attested addresses
        if (user.loggedIn) {
            await getAttestedAddresses(user.addr);
        }
    });

    document.getElementById('attestButton').addEventListener('click', attestAsAffiliate);
    document.getElementById('loginButton').addEventListener('click', authenticateWithFlow);
    document.getElementById('logoutButton').addEventListener('click', unauthenticateWithFlow);
});

fcl.config({
    "app.detail.title": "Flow Affiliated Accounts", // the name of your DApp
    "app.detail.icon": "https://assets-global.website-files.com/5f734f4dbd95382f4fdfa0ea/63ce603ae36f46f6bb67e51e_flow-logo.svg", // your DApps icon
    "flow.network": network,
    "accessNode.api": fclConfigInfo[network].accessNode,
    "discovery.wallet": fclConfigInfo[network].discoveryWallet,
    "discovery.authn.endpoint": fclConfigInfo[network].discoveryAuthnEndpoint,
    // adds in opt-in wallets like Dapper and Ledger
    "discovery.authn.include": fclConfigInfo[network].discoveryAuthInclude
}).load({ flowJSON });

let user = { loggedIn: false, addr: "" };

async function authenticateWithFlow() {
    const user = await fcl.authenticate();
    await getAttestedAddresses(user.addr);
    return user;
};

function unauthenticateWithFlow() {
    console.log('Logging out...');
    fcl.unauthenticate();
    window.location.reload();
};

async function createAttestation(hexPublicKey, signature, ethAddress) {
    const txId =
        await fcl.mutate({
            cadence: CREATE_ATTESTATION,
            proposer: fcl.currentUser,
            payer: fcl.currentUser,
            authorizations: [fcl.currentUser],
            args: (arg, t) => [
                arg(hexPublicKey, t.String),
                arg(signature, t.String),
                arg(ethAddress, t.String)
            ],
            limit: 9999
        })
    const tx = await fcl.tx(txId).onceExecuted();
    console.log(tx);
    await getAttestedAddresses(user.addr)
};

async function getAttestedAddresses(address) {
    const result = await fcl.query({
        cadence: GET_ATTESTED_ADDRESSES_WITH_STATUS,
        args: (arg, t) => [fcl.arg(address, t.Address)]
    });
    console.log(result);
    renderAttestedAddresses(result);
};

function generateTableHTML(addressStatuses) {
    let tableHTML = '<table>';
    tableHTML += '<tr><th class="remove-header">Remove</th><th>Attested Address</th><th>Verified</th></tr>';

    for (const [address, isVerified] of Object.entries(addressStatuses)) {
        const etherscanUrl = `https://etherscan.io/address/${address}`;
        tableHTML += `
            <tr>
                <td><input type="checkbox" class="address-checkbox" data-address="${address}"></td>
                <td><a href="${etherscanUrl}" target="_blank">${address}</a></td>
                <td>${isVerified ? '✅' : '❌'}</td>
            </tr>
        `;
    }
    tableHTML += '</table>';
    return tableHTML;
}

function bindTableEvents() {
    const removeHeader = document.querySelector('.remove-header');
    const checkboxes = document.querySelectorAll('.address-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => toggleRemoveHeaderActiveState(checkboxes, removeHeader));
    });

    removeHeader.addEventListener('click', () => removeSelectedAddresses(checkboxes, removeHeader));
}

function toggleRemoveHeaderActiveState(checkboxes, removeHeader) {
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    if (anyChecked) {
        removeHeader.classList.add('active');
    } else {
        removeHeader.classList.remove('active');
    }
}

async function removeSelectedAddresses(checkboxes, removeHeader) {
    if (removeHeader.classList.contains('active')) {
        const checkedAddresses = getCheckedAddresses(checkboxes);
        await sendRemoveTransaction(checkedAddresses);
    }
}

function getCheckedAddresses(checkboxes) {
    return Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.getAttribute('data-address'));
}

async function sendRemoveTransaction(checkedAddresses) {
    try {
        const txId = await fcl.mutate({
            cadence: REMOVE_ATTESTATIONS,
            args: (arg, t) => [arg(checkedAddresses, t.Array(t.String))],
            proposer: fcl.currentUser,
            payer: fcl.currentUser,
            authorizations: [fcl.currentUser],
            limit: 9999
        });

        const transaction = await fcl.tx(txId).onceExecuted();
        console.log('Transaction confirmed:', transaction);

        await getAttestedAddresses(user.addr);
    } catch (error) {
        console.error('Error sending transaction:', error);
    }
}

async function renderAttestedAddresses(addressStatuses) {
    const tableDiv = document.getElementById('attestedAddressesTable');
    if (Object.keys(addressStatuses).length === 0) {
        tableDiv.innerHTML = '<p>No attested addresses found.</p>';
        return;
    }

    tableDiv.innerHTML = generateTableHTML(addressStatuses);
    bindTableEvents();
}

async function attestAsAffiliate() {
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
        const user = await authenticateWithFlow()
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

        await createAttestation(publicKey, signature, signerAddress);

    } catch (err) {
        console.error(err);  // Log any errors
    }
};