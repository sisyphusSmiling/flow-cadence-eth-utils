import "ETHUtils"

access(all) fun main(hexPublicKey: String, hexSignature: String, message: String): Bool {
    return ETHUtils.verifySignature(hexPublicKey: hexPublicKey, hexSignature: hexSignature, message: message)
}