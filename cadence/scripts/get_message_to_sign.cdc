import "ETHUtils"
import "ETHAffiliatedAccount"

access(all) fun main(flowAddress: Address, hexPublicKey: String): String {
    return ETHAffiliatedAccount.AttestationMessage(
        flowAddress: flowAddress,
        ethAddress: ETHUtils.getETHAddressFromPublicKey(hexPublicKey: hexPublicKey)
    ).asEthereumMessage()
}