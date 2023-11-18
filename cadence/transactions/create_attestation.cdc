import "ETHAffiliatedAccount"

transaction(
    hexPublicKey: String,
    signature: String,
    ethAddress: String,
    timestamp: UFix64
) {

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
            ethAddress: ethAddress,
            timestamp: timestamp
        )
    }
}
