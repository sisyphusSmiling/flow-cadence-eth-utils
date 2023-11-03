import "ETHAffiliatedAccount"

access(all) fun main(address: Address): [String] {
    return getAccount(address).getCapability<&{ETHAffiliatedAccount.AttestationManagerPublic}>(
            ETHAffiliatedAccount.PUBLIC_PATH
        ).borrow()
        ?.getAttestedAddresses()
        ?? panic("Could not borrow reference to AttestationManagerPublic from the provided account")
}