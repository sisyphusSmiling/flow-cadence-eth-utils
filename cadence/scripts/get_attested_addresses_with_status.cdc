import "ETHAffiliatedAccount"

access(all) fun main(address: Address): {String: Bool} {
    let manager = getAccount(address).getCapability<&{ETHAffiliatedAccount.AttestationManagerPublic}>(
            ETHAffiliatedAccount.PUBLIC_PATH
        ).borrow()
        ?? panic("Could not borrow reference to AttestationManagerPublic from the provided account")
    let attestedAffiliates: [String] = manager.getAttestedAddresses()
    
    let response: {String: Bool} = {}
    for affiliate in attestedAffiliates {
        response.insert(key: affiliate, manager.borrowAttestation(ethAddress: affiliate)!.verify())
    }

    return response
}
