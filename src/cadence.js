/*** Transactions ***/

const CREATE_ATTESTATION = `
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
`;

const REMOVE_ATTESTATIONS = `
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
`;

/*** Scripts ***/

const GET_CURRENT_BLOCK_TIMESTAMP = `
    access(all) fun main(): UFix64 {
        return getCurrentBlock().timestamp
    }
`

const GET_ATTESTED_ADDRESSES = `
import "ETHAffiliatedAccounts"

access(all) fun main(address: Address): [String] {
    return getAccount(address).capabilities.borrow<&ETHAffiliatedAccounts.AttestationManager>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        )?.getAttestedAddresses() ?? []
}
`;

const GET_ATTESTED_ADDRESSES_WITH_STATUS = `
import "ETHAffiliatedAccounts"

access(all) fun main(address: Address): {String: Bool} {
    let manager = getAccount(address).capabilities.borrow<&ETHAffiliatedAccounts.AttestationManager>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        ) ?? panic("Could not borrow reference to AttestationManagerPublic from the provided account")
    let attestedAffiliates: [String] = manager.getAttestedAddresses()
    
    let response: {String: Bool} = {}
    for affiliate in attestedAffiliates {
        response.insert(key: affiliate, manager.borrowAttestation(ethAddress: affiliate)!.verify())
    }

    return response
}
`;

module.exports = {  
    CREATE_ATTESTATION,
    REMOVE_ATTESTATIONS,
    GET_CURRENT_BLOCK_TIMESTAMP,
    GET_ATTESTED_ADDRESSES,
    GET_ATTESTED_ADDRESSES_WITH_STATUS
};