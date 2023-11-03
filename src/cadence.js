// Replace with import alias
module.exports.CREATE_ATTESTATION = `
import "ETHAffiliatedAccount"

transaction(hexPublicKey: String, signature: String, ethAddress: String) {

    let manager: &ETHAffiliatedAccount.AttestationManager

    prepare(signer: AuthAccount) {

        if signer.type(at: ETHAffiliatedAccount.STORAGE_PATH) == nil {
            signer.save(<-ETHAffiliatedAccount.createManager(), to: ETHAffiliatedAccount.STORAGE_PATH)

            signer.unlink(ETHAffiliatedAccount.PUBLIC_PATH)
            signer.link<&{ETHAffiliatedAccount.AttestationManagerPublic}>(
                ETHAffiliatedAccount.PUBLIC_PATH,
                target: ETHAffiliatedAccount.STORAGE_PATH
            )
        }

        self.manager = signer.borrow<&ETHAffiliatedAccount.AttestationManager>(from: ETHAffiliatedAccount.STORAGE_PATH)
            ?? panic("Could not borrow a reference to the AttestationManager")

    }

    execute {
        self.manager.createAttestation(
            hexPublicKey: hexPublicKey,
            signature: signature,
            ethAddress: ethAddress
        )
    }
}
`;

// Replace with import alias
module.exports.GET_ATTESTED_ADDRESSES = `
import "ETHAffiliatedAccount"

access(all) fun main(address: Address): [String] {
    return getAccount(address).getCapability<&{ETHAffiliatedAccount.AttestationManagerPublic}>(
            ETHAffiliatedAccount.PUBLIC_PATH
        ).borrow()
        ?.getAttestedAddresses()
        ?? panic("Could not borrow reference to AttestationManagerPublic from the provided account")
}
`;

// Replace with import alias
module.exports.GET_ATTESTED_ADDRESSES_WITH_STATUS = `
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
`;