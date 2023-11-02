module.exports.network = 'emulator'

module.exports.fclConfigInfo = {
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
}

    // Update UI based on authentication state
module.exports.updateAuthUI = function(user) {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userAddress = document.getElementById('userAddress');

    if (user.loggedIn) {
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        userAddress.textContent = `Welcome, ${user.addr}!`;
    } else {
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        userAddress.textContent = 'Please log in.';
    }
}