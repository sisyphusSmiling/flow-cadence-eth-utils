import "ETHUtils"
import "ETHAffiliatedAccount"

access(all) fun main(message: String): String {
    let ethereumMessagePrefix: String = "\u{0019}Ethereum Signed Message:\n".concat(message.length.toString())
    return ethereumMessagePrefix.concat(message)
}