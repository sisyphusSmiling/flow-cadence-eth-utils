import "ETHAffiliatedAccounts"

access(all) fun main(address: Address): [String] {
    return getAccount(address).getCapability<&{ETHAffiliatedAccounts.AttestationManagerPublic}>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        ).borrow()
        ?.getAttestedAddresses() ?? []
}