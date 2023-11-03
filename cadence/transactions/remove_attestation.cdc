import "ETHAffiliatedAccount"

transaction(ethAddress: String) {

    let manager: &ETHAffiliatedAccount.AttestationManager

    prepare(signer: AuthAccount) {

        self.manager = signer.borrow<&ETHAffiliatedAccount.AttestationManager>(from: ETHAffiliatedAccount.STORAGE_PATH)
            ?? panic("Could not borrow a reference to the AttestationManager")

    }

    execute {
        if let attestation: @ETHAffiliatedAccount.Attestation <- self.manager.removeAttestation(ethAddress: ethAddress) {
            destroy attestation
        }
    }
}
