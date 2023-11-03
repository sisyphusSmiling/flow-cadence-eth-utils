// Replace with import alias
module.exports.CREATE_ATTESTATION = `
import ETHAffiliatedAccount from 0xf8d6e0586b0a20c7

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
import ETHAffiliatedAccount from 0xf8d6e0586b0a20c7

access(all) fun main(address: Address): [String] {
    return getAccount(address).getCapability<&{ETHAffiliatedAccount.AttestationManagerPublic}>(
            ETHAffiliatedAccount.PUBLIC_PATH
        ).borrow()
        ?.getAttestedAddresses()
        ?? panic("Could not borrow reference to AttestationManagerPublic from the provided account")
}
`