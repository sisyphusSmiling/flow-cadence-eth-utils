import "ETHAffiliatedAccount"

transaction(hexPublicKey: String, signature: String, ethAddress: String) {

    prepare(signer: AuthAccount) {

        if signer.type(at: ETHAffiliatedAccount.STORAGE_PATH) != nil {
            return
        }

        signer.save(<-ETHAffiliatedAccount.createManager(), to: ETHAffiliatedAccount.STORAGE_PATH)

        signer.unlink(ETHAffiliatedAccount.PUBLIC_PATH)
        signer.link<&{ETHAffiliatedAccount.AttestationManagerPublic}>(
            ETHAffiliatedAccount.PUBLIC_PATH,
            target: ETHAffiliatedAccount.STORAGE_PATH
        )
    }
}
