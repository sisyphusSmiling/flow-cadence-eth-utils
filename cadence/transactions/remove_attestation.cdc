import "ETHAffiliatedAccounts"

transaction(ethAddresses: [String]) {

    let manager: &ETHAffiliatedAccounts.AttestationManager

    prepare(signer: AuthAccount) {

        self.manager = signer.borrow<&ETHAffiliatedAccounts.AttestationManager>(from: ETHAffiliatedAccounts.STORAGE_PATH)
            ?? panic("Could not borrow a reference to the AttestationManager")

    }

    execute {
        for ethAddress in ethAddresses {
            if let attestation: @ETHAffiliatedAccounts.Attestation <- self.manager.removeAttestation(ethAddress: ethAddress) {
                destroy attestation
            }
        }
    }
}
