const EC = require("elliptic").ec
const ec = new EC('secp256k1')
const {Blockchain, Transaction} = require("./blockchain")

let myCoin = new Blockchain()



const myKey = ec.keyFromPrivate("0d864e7144fc512dd2eac491d5ad7f3432e0ff34417ad39bffcc2633c77277f0")
const myWallet = myKey.getPublic('hex')

const tx1 = new Transaction(Date.now(), myWallet, 'toaddress1', 10)
tx1.sign_transaction(myKey)
myCoin.add_transaction(tx1)

console.log("Starting the miner")
myCoin.mine_pending_transactions(myWallet)
myCoin.mine_pending_transactions(myWallet)

console.log("Balance of miner1 is : ", myCoin.get_balance_of_address(myWallet))

