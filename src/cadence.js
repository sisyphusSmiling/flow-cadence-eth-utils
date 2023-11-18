/*** Transactions ***/

const CREATE_ATTESTATION = `
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
`;

const REMOVE_ATTESTATIONS = `
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
    return getAccount(address).getCapability<&{ETHAffiliatedAccounts.AttestationManagerPublic}>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        ).borrow()
        ?.getAttestedAddresses() ?? []
}
`;

const GET_ATTESTED_ADDRESSES_WITH_STATUS = `
import "ETHAffiliatedAccounts"

access(all) fun main(address: Address): {String: Bool} {
    if let manager = getAccount(address).getCapability<&{ETHAffiliatedAccounts.AttestationManagerPublic}>(
            ETHAffiliatedAccounts.PUBLIC_PATH
        ).borrow() {
        let attestedAffiliates: [String] = manager.getAttestedAddresses()

        let response: {String: Bool} = {}
        for affiliate in attestedAffiliates {
            response.insert(key: affiliate, manager.borrowAttestation(ethAddress: affiliate)!.verify())
        }

        return response
    }
    return {}
}
`;

module.exports = {  
    CREATE_ATTESTATION,
    REMOVE_ATTESTATIONS,
    GET_CURRENT_BLOCK_TIMESTAMP,
    GET_ATTESTED_ADDRESSES,
    GET_ATTESTED_ADDRESSES_WITH_STATUS
};