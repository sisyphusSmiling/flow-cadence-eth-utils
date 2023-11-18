import "ETHUtils"

import "StringUtils"
import "AddressUtils"

/// Allows a Flow account to attest an affiliated Ethereum address by storing a signed message containing their Flow
/// address (where the attestation resides) and their Ethereum address along with the public key paired to the private
/// key that signed the message.
///
access(all) contract ETHAffiliatedAccounts {

    access(all) let STORAGE_PATH: StoragePath
    access(all) let PUBLIC_PATH: PublicPath

    /// Delimeter between message fields
    access(all) let MESSAGE_DELIMETER: String
    /// Allowed time buffer from when message was signed to attesation construction
    access(all) let MESSAGE_TIMESTAMP_BUFFER: UFix64

    access(all) event AccountAffiliationUpdated(id: UInt64, flowAddress: Address, ethAddress: String, active: Bool)

    /* AttestationMessage */
    //
    /// Struct representing the signed attestation of account affiliation
    ///
    access(all) struct AttestationMessage {
        access(all) let flowAddress: Address
        access(all) let ethAddress: String
        access(all) let timestamp: UFix64

        init(flowAddress: Address, ethAddress: String, timestamp: UFix64) {
            self.flowAddress = flowAddress
            self.ethAddress = ethAddress
            self.timestamp = timestamp
        }

        access(all) fun toString(): String {
            return self.flowAddress.toString()
                .concat(ETHAffiliatedAccounts.MESSAGE_DELIMETER)
                .concat(self.ethAddress)
                .concat(ETHAffiliatedAccounts.MESSAGE_DELIMETER)
                .concat(self.timestamp.toString())
        }

        access(all) fun toBytes(): [UInt8] {
            return self.toString().utf8
        }

        access(all) fun asEthereumMessage(): String {
            let suffix: String = self.toString()
            let prefix: String = "\u{0019}Ethereum Signed Message:\n".concat(suffix.length.toString())
            return prefix.concat(suffix)
        }
    }

    /* Attestation */
    //
    /// Representing a signed attestation of account affiliation between Flow & ETH accounts
    ///
    access(all) resource Attestation {
        access(self) let hexPublicKey: String
        access(self) let signature: String
        access(self) let message: AttestationMessage

        init(
            hexPublicKey: String,
            signature: String,
            message: AttestationMessage
        ) {
            self.hexPublicKey = hexPublicKey
            self.signature = signature
            self.message = message
        }

        //--- Public ---\\

        access(all) fun getMessage(): AttestationMessage {
            return self.message
        }

        access(all) fun verify(): Bool {
            // Valid signature
            let validSignature: Bool = ETHUtils.verifySignature(
                hexPublicKey: self.hexPublicKey,
                hexSignature: self.signature,
                message: self.message.toString()
            )
            // Valid Flow address
            let validFlowAddress: Bool = self.verifyFlowMessageAddressMatchesOwner()
            // Valid ETH address
            let validETHAddress: Bool = self.verifyETHAddressMatchesPublicKey()

            return validSignature && validFlowAddress && validETHAddress
        }

        //--- Private ---\\

        access(self) fun verifySignature(): Bool {
            return ETHUtils.verifySignature(
                hexPublicKey: self.hexPublicKey,
                hexSignature: self.signature,
                message: self.message.toString()
            )
        }

        access(self) fun verifyFlowMessageAddressMatchesOwner(): Bool {
            return self.owner?.address != nil ? self.message.flowAddress == self.owner!.address : false
        }

        access(self) fun verifyETHAddressMatchesPublicKey(): Bool {
            return self.message.ethAddress == ETHUtils.getETHAddressFromPublicKey(hexPublicKey: self.hexPublicKey)
        }

    }

    /* AttestationManager */
    //
    /// Public interface for the AttestationManager resource
    ///
    access(all) resource interface AttestationManagerPublic {
        access(all) fun getAttestedAddresses(): [String]
        access(all) fun borrowAttestation(ethAddress: String): &Attestation?
        access(all) fun verify(ethAddress: String): Bool
    }

    /// Manages the attestations of affiliated ETH accounts
    ///
    access(all) resource AttestationManager : AttestationManagerPublic {
        access(all) let attestations: @{String: Attestation}

        init() {
            self.attestations <- {}
        }

        //--- Owner ---\\

        access(all) fun createAttestation(hexPublicKey: String, signature: String, ethAddress: String, timestamp: UFix64) {
            pre {
                self.owner != nil:
                    "No Flow owner to attest as affiliate"
                ETHAffiliatedAccounts.verifyETHAddressMatchesPublicKey(ethAddress: ethAddress, hexPublicKey: hexPublicKey):
                    "Public key does not correspond to the valid ETH address in the message."
                self.attestations[ethAddress] == nil:
                    "Account has already been attested"
                self._validTimestampRange(timestamp):
                    "Timestamp is not within the valid range"
            }

            let attestation: @ETHAffiliatedAccounts.Attestation <- create Attestation(
                hexPublicKey: hexPublicKey,
                signature: signature,
                message: AttestationMessage(
                    flowAddress: self.owner!.address,
                    ethAddress: ethAddress,
                    timestamp: timestamp
                )
            )

            self.attestations[ethAddress] <-! attestation
            let attestationRef: &ETHAffiliatedAccounts.Attestation = self.borrowAttestation(ethAddress: ethAddress)
                ?? panic("Problem adding attestation to account")
            assert(attestationRef.verify(), message: "Invalid signature provided for attested ETH account")

            emit AccountAffiliationUpdated(
                id: attestationRef.uuid,
                flowAddress: self.owner!.address,
                ethAddress: ethAddress,
                active: true
            )
        }

        access(all) fun removeAttestation(ethAddress: String): @Attestation? {
            if self.attestations[ethAddress] == nil {
                return nil
            }
            let attesation: @ETHAffiliatedAccounts.Attestation <- self.attestations.remove(key: ethAddress)!
            emit AccountAffiliationUpdated(
                id: attesation.uuid,
                flowAddress: attesation.getMessage().flowAddress,
                ethAddress: ethAddress,
                active: false
            )
            return <- attesation
        }

        //--- Public ---\\

        access(all) fun getAttestedAddresses(): [String] {
            return self.attestations.keys
        }

        access(all) fun borrowAttestation(ethAddress: String): &Attestation? {
            return &self.attestations[ethAddress] as &Attestation?
        }

        access(all) fun verify(ethAddress: String): Bool {
            return self.borrowAttestation(ethAddress: ethAddress)?.verify() ?? false
        }

        //--- Internal ---\\

        access(self) fun _validTimestampRange(_ timestamp: UFix64): Bool {
            let now = getCurrentBlock().timestamp
            return now - ETHAffiliatedAccounts.MESSAGE_TIMESTAMP_BUFFER <= timestamp && timestamp <= now
        }

        destroy() {
            destroy self.attestations
        }
    }

    //--- Public ---\\

    access(all) fun createManager(): @AttestationManager {
        return <- create AttestationManager()
    }

    access(all) fun verifyETHAddressMatchesPublicKey(ethAddress: String, hexPublicKey: String): Bool {
        return ETHUtils.getETHAddressFromPublicKey(hexPublicKey: hexPublicKey) == ethAddress
    }

    init() {
        self.STORAGE_PATH = /storage/ETHAccountAttestation
        self.PUBLIC_PATH = /public/ETHAccountAttestation

        self.MESSAGE_DELIMETER = ":"
        self.MESSAGE_TIMESTAMP_BUFFER = 10.0 * 60000.0 // 10 minute buffer
    }
}
