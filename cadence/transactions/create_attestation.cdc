import "ETHAffiliatedAccounts"

transaction(
    hexPublicKey: String,
    signature: String,
    ethAddress: String,
    timestamp: UFix64
) {

    let manager: auth(ETHAffiliatedAccounts.Disown) &ETHAffiliatedAccounts.AttestationManager

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {

        if signer.storage.type(at: ETHAffiliatedAccounts.STORAGE_PATH) == nil {
            signer.storage.save(<-ETHAffiliatedAccounts.createManager(), to: ETHAffiliatedAccounts.STORAGE_PATH)

            signer.capabilities.unpublish(ETHAffiliatedAccounts.PUBLIC_PATH)
            let mgrCap = signer.capabilities.storage.issue<&ETHAffiliatedAccounts.AttestationManager>(
                ETHAffiliatedAccounts.STORAGE_PATH
            )
            signer.capabilities.publish(mgrCap, at: ETHAffiliatedAccounts.PUBLIC_PATH)
        }

        self.manager = signer.storage.borrow<auth(ETHAffiliatedAccounts.Disown) &ETHAffiliatedAccounts.AttestationManager>(
                from: ETHAffiliatedAccounts.STORAGE_PATH
            ) ?? panic("AttestationManager not found in signer's account storage. Reconfigure at \(ETHAffiliatedAccounts.STORAGE_PATH) & try again.")

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
