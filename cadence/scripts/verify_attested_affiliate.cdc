import "ETHAffiliatedAccounts"

access(all) fun main(flowAddress: Address, ethAddress: String): Bool {
    let account = getAccount(flowAddress)
    let manager = account.capabilities.borrow<&ETHAffiliatedAccounts.AttestationManager>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        ) ?? panic("Could not borrow reference to AttestationManager from the provided account")
    let attestation = manager.borrowAttestation(ethAddress: ethAddress)
        ?? panic("No attestation found for provided ETH address")
    return attestation.verify()
}