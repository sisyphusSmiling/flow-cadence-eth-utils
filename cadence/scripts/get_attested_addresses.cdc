import "ETHAffiliatedAccounts"

access(all) fun main(address: Address): [String] {
    return getAccount(address).capabilities.borrow<&ETHAffiliatedAccounts.AttestationManager>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        )?.getAttestedAddresses() ?? []
}