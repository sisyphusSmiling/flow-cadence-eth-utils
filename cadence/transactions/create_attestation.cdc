import "ETHAffiliatedAccounts"

transaction(
    hexPublicKey: String,
    signature: String,
    ethAddress: String,
    timestamp: UFix64
) {

    let manager: &ETHAffiliatedAccounts.AttestationManager

    prepare(signer: AuthAccount) {

        if signer.type(at: ETHAffiliatedAccounts.STORAGE_PATH) == nil {
            signer.save(<-ETHAffiliatedAccounts.createManager(), to: ETHAffiliatedAccounts.STORAGE_PATH)

            signer.unlink(ETHAffiliatedAccounts.PUBLIC_PATH)
            signer.link<&{ETHAffiliatedAccounts.AttestationManagerPublic}>(
                ETHAffiliatedAccounts.PUBLIC_PATH,
                target: ETHAffiliatedAccounts.STORAGE_PATH
            )
        }

        self.manager = signer.borrow<&ETHAffiliatedAccounts.AttestationManager>(from: ETHAffiliatedAccounts.STORAGE_PATH)
            ?? panic("Could not borrow a reference to the AttestationManager")

    }

    execute {
        self.manager.createAttestation(
            hexPublicKey: hexPublicKey,
            signature: signature,
            ethAddress: ethAddress,
            timestamp: timestamp
        )
    }
}
