import "ETHUtils"

import "StringUtils"
import "AddressUtils"

/// Allows a Flow account to attest an affiliated Ethereum address by storing a signed message containing their Flow
/// address (where the attestation resides) and their Ethereum address along with the public key paired to the private
/// key that signed the message.
///
access(all) contract ETHAffiliatedAccount {

    access(all) let STORAGE_PATH: StoragePath
    access(all) let PUBLIC_PATH: PublicPath

    access(all) let MESSAGE_DELIMETER: String

    /* AttestationMessage */
    //
    /// Struct representing the signed attestation of account affiliation
    ///
    access(all) struct AttestationMessage {
        access(all) let flowAddress: Address
        access(all) let ethAddress: String

        init(flowAddress: Address, ethAddress: String) {
            self.flowAddress = flowAddress
            self.ethAddress = ethAddress
        }

        access(all) fun toString(): String {
            return self.flowAddress.toString()
                .concat(ETHAffiliatedAccount.MESSAGE_DELIMETER)
                .concat(self.ethAddress)
        }

        access(all) fun toBytes(): [UInt8] {
            return self.toString().utf8
        }

        access(all) fun asEthereumMessage(): String {
            let suffix = self.toString()
            let prefix = "\u{0019}Ethereum Signed Message:\n".concat(suffix.length.toString())
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
            assert(validSignature, message: "invalid signature of message: ".concat(self.message.toString()))
            // Valid Flow address
            let validFlowAddress: Bool = self.verifyFlowMessageAddressMatchesOwner()
            assert(validFlowAddress, message: "invalid flow address")
            // Valid ETH address
            let validETHAddress = self.verifyETHAddressMatchesPublicKey()
            assert(validETHAddress, message: "invalid eth address")

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

        access(all) fun createAttestation(hexPublicKey: String, signature: String, ethAddress: String) {
            pre {
                self.owner != nil:
                    "No Flow owner to attest as affiliate"
                ETHAffiliatedAccount.verifyETHAddressMatchesPublicKey(ethAddress: ethAddress, hexPublicKey: hexPublicKey):
                    "Public key does not correspond to the valid ETH address in the message."
            }
            post {
                self.attestations[ethAddress] != nil: "Problem creating Attestation"
            }

            let attestation <- create Attestation(
                hexPublicKey: hexPublicKey,
                signature: signature,
                message: AttestationMessage(
                    flowAddress: self.owner!.address,
                    ethAddress: ethAddress
                )
            )

            assert(attestation.verify(), message: "Invalid signature provided for attested ETH account")

            self.attestations[ethAddress] <-! attestation
        }

        //--- Public ---\\

        access(all) fun borrowAttestation(ethAddress: String): &Attestation? {
            return &self.attestations[ethAddress] as &Attestation?
        }

        access(all) fun verify(ethAddress: String): Bool {
            return self.borrowAttestation(ethAddress: ethAddress)?.verify() ?? false
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

        self.MESSAGE_DELIMETER = "|"
    }
}
