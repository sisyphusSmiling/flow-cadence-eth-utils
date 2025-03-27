import "ETHAffiliatedAccounts"

transaction(ethAddresses: [String]) {

    let manager: &ETHAffiliatedAccounts.AttestationManager

    prepare(signer: auth(BorrowValue) &Account) {

        self.manager = signer.storage.borrow<auth(ETHAffiliatedAccounts.Disown) &ETHAffiliatedAccounts.AttestationManager>(
                from: ETHAffiliatedAccounts.STORAGE_PATH
            ) ?? panic("AttestationManager not found in signer's account storage. Reconfigure at \(ETHAffiliatedAccounts.STORAGE_PATH) & try again.")

    }

    execute {
        for ethAddress in ethAddresses {
            if let attestation: @ETHAffiliatedAccounts.Attestation <- self.manager.removeAttestation(ethAddress: ethAddress) {
                destroy attestation
            }
        }
    }
}
