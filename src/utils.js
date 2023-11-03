const network = 'emulator';

const fclConfigInfo = {
    emulator: {
        accessNode: 'http://127.0.0.1:8888',
        discoveryWallet: 'http://localhost:8701/fcl/authn',
        discoveryAuthInclude: []
    },
    testnet: {
        accessNode: 'https://rest-testnet.onflow.org',
        discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
        discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/testnet/authn',
        // Adds in Dapper + Ledger
        discoveryAuthInclude: ["0x82ec283f88a62e65", "0x9d2e44203cb13051"]
    },
    mainnet: {
        accessNode: 'https://rest-mainnet.onflow.org',
        discoveryWallet: 'https://fcl-discovery.onflow.org/authn',
        discoveryAuthnEndpoint: 'https://fcl-discovery.onflow.org/api/authn',
        // Adds in Dapper + Ledger
        discoveryAuthInclude: ["0xead892083b3e2c6c", "0xe5cd26afebe62781"]
    }
};

// Update UI based on authentication state
function updateAuthUI(user) {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userAddress = document.getElementById('userAddress');

    if (user.loggedIn) {
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';

        // Determine the correct FlowView URL based on the network
        const flowViewURL = network === 'mainnet'
            ? `https://flowview.app/account/${user.addr}`
            : `https://${network}.flowview.app/account/${user.addr}`;

        // Set the address as a hyperlink
        userAddress.innerHTML = `Welcome, <a href="${flowViewURL}" target="_blank" class="user-link">${user.addr}</a>!`;

    } else {
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
    }
};

module.exports = {
    network,
    fclConfigInfo,
    updateAuthUI
};