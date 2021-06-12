const SHA256 = require("crypto-js/sha256")
const EC = require("elliptic").ec
const ec = new EC('secp256k1')

class Transaction {
    constructor(timestamp, from_address, to_address, amount) {
        this.timestamp = timestamp
        this.from_address = from_address
        this.to_address = to_address
        this.amount = amount
    }

    calculate_hash() {
        return SHA256(this.from_address + this.to_address + this.amount + this.timestamp).toString()
    }

    sign_transaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.from_address) {
            throw new Error("You cant sign transaction of other wallets.")
        }
        const hashTx = this.calculate_hash()
        const sig = signingKey.sign(hashTx, 'base64')
        this.signature = sig.toDER('hex')
    }

    is_valid() {
        if (this.from_address === null) return true

        if (!this.signature || this.signature.length === 0) {
            throw new Error("No signature in this transaction")
        }

        const publicKey = ec.keyFromPublic(this.from_address, 'hex')
        return publicKey.verify(this.calculate_hash(), this.signature)
    }
}

class Block {
    constructor(timestamp, transactions, previous_hash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previous_hash = previous_hash;
        this.hash = this.calculate_hash()
        this.nonce = 0
    }

    calculate_hash() {
        return SHA256(this.previous_hash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString()
    }

    mine_block(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.hash = this.calculate_hash()
            this.nonce++
        }
        console.log("MINED BLOCK: " + this.hash)
    }

    has_valid_transactions() {
        for (const tx of this.transactions) {
            if (!tx.is_valid()) {
                return false;
            }
        }
        return true
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.create_genesis_block()]
        this.difficulty = 2
        this.pending_transactions = []
        this.mining_reward = 100
    }

    create_genesis_block() {
        return new Block(Date.now(), [], '0')
    }

    get_latest_block() {
        return this.chain[this.chain.length - 1];
    }

    mine_pending_transactions(minerRewardAddress) {
        let block = new Block(Date.now(), this.pending_transactions)
        block.mine_block(this.difficulty)

        this.chain.push(block)
        this.pending_transactions = [
            new Transaction(Date.now(), null, minerRewardAddress, this.mining_reward)
        ]
    }


    add_transaction(transaction) {
        if (!transaction.to_address || !transaction.from_address) {
            throw new Error("Addresses not specified")
        }
        if (!transaction.is_valid()) {
            throw new Error("Invalid transaction")
        }
        this.pending_transactions.push(transaction)
    }

    get_balance_of_address(address) {
        let balance = 0
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.to_address == address) {
                    balance += transaction.amount
                } else if (transaction.from_address == address) {
                    balance -= transaction.amount
                }
            }
        }
        return balance
    }

    is_chain_valid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1]

            if (!currentBlock.has_valid_transactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculate_hash()) {
                return false;
            }

            if (currentBlock.previous_hash !== previousBlock.hash) {
                return false;
            }
        }
        return true
    }

    // add_block(newBlock) {
    //     newBlock.previous_hash = this.get_latest_block().hash
    //     newBlock.mine_block(this.difficulty)
    //     this.chain.push(newBlock)
    // }
}

module.exports.Blockchain = Blockchain
module.exports.Transaction = Transaction