import "ETHAffiliatedAccounts"

access(all) fun main(address: Address): {String: Bool} {
    let manager = getAccount(address).capabilities.borrow<&ETHAffiliatedAccounts.AttestationManager>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        ) ?? panic("Could not borrow reference to AttestationManager from the provided account")
    let attestedAffiliates: [String] = manager.getAttestedAddresses()
    
    let response: {String: Bool} = {}
    for affiliate in attestedAffiliates {
        response.insert(key: affiliate, manager.borrowAttestation(ethAddress: affiliate)!.verify())
    }

    return response
}
