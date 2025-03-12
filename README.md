# decentralization
Real decentralization. Better than all PoW public blockchains.

[The Chinese document](http://acc.guideep.com) is recommanded.

[In the EBook "The Real Decentralization"](https://www.amazon.com/Real-Decentralization-Blockchains-Freedom-Trustworthy-ebook/dp/B0CFL72JSP/ref=sr_1_1) you can learn more.

[Decentrailblazer](https://poe.com/chat/2p7499h4ra2tmse7g71) and [Decentralisage](https://beta.character.ai/chat?char=ZG4PgDel40hHB593boC7mNnIX-ED1c6LecwsbLqP0hM) are clever bots based on LLMs and can discuss with you.

## Technology
### Summary

The Atomic Ownership Blockchains can offer full decentralization and good scalability for cryptocurrencies.

As we all know, the PoW-based blockchains have serious flaws in terms of scaling. Because the performance is too low and the cost of electricity is too large, they can never become global-scale currencies.

And they are not as well decentralized as stated. PoW tries to get decentralization with voting of computing power. While computing power can be purchased freely. In fact PoW is PoWealth. If someone among the mega-rich wanted to attack Bitcoin, he could do it by simply buying or renting 51% of the computing power.

We remember that banknote-based currencies work much better. They are efficient, cost less, and cannot be attacked by the rich. The only disadvantage is that they cannot be transferred online and cannot be guaranteed to be unique. However, we can solve these problems by creating banknotes on the Atomic Ownership Blockchains(AOB), with each blockchain representing a single banknote.

### The Atomic Ownership Blockchains

Each blockchain is private. It has an owner and only the owner can add blocks. Blocks added on a private blockchain do not require a consensus algorithm.

When adding a block, the owner can write in the block: I would give the blockchain to Alice. Then, Alice becomes the new owner of the blockchain. Only she can give the blockchain to another user by adding the next block.

In this way, the blockchain can be passed through the crowd with no need of consensus algorithms. If there are many such blockchains, they run separately and do not interfere with each other. The blockchains constitute a highly decentralized and scalable system. There is no disadvantage caused by PoW.

Every blockchain can record the history of its ownership well. It is enough to act as a banknote, because ownership is the only variable for a working banknote.

Like a physical banknote, every blockchain banknote has a fixed denomination, which never changes in payments. The payer selects some banknotes from his, makes up the amount to be paid, transfers the selected banknotes to the payee, and the payment is completed.

### Security

An blockchain could be forked if the current owner adds multiple blocks at the same location. This is clearly a violation. We have three methods to deal with it.

1) Punishing the offender. Users should make sure every block has been broadcast, whatever he is the payer or payee. Once we see multiple conflict blocks are broadcast, we should block the offender at once. Although there is no real account and we can not punish the real people, we may set a rule for every new account to destroy some banknotes before activation. Once the account is blocked, the offender will suffer losses to build a new account.

2) Choosing the branch that broadcast first. For the multiple conflict blocks, we determine that the first broadcast block is valid. If the blocks were broadcast in such a short time that users in the network do not get the same order, all the payees of the conflict blocks may notice the violation soon and reject the payment at once. Double spending will never succeed. We must stay online to record the broadcast order. Otherwise, we can reject the forked banknotes for all branches. With a very small probability of network problems, honest users may get different orders, then they may reject the forked banknote from each other and pay with other banknotes.

3) Merging forked banknotes. When the branches of one banknote are transferred to the same user, the user can add one block on all branches to merge it. As a reward, the merge block offers its maker the right to build a new banknote with random denomination. So we can guarantee the number of forked banknotes is limited.

Methods 1 and 2 guarantee that there is no benefit but loss in forking an banknote. Method 3 guarantees even if someone would attack with significant losses, he can not harm the system.

We never make decisions through any forms of voting to avoid Sybil Attacks. All decisions are based on reliable evidence and not on the free will of people.

We can guarantee each banknote to be unique by setting the Id to a signature of the inherent information.

### Grouping

For security reasons, we have to broadcast every block immediately. It may cause performance problems when the network grows large. We may solve it by grouping.

Randomly divide the banknotes into multiple groups. Each user may join some groups and try to use the banknotes in the groups first. New blocks are broadcast only to the users in the group of the banknote. If two users have frequent transactions, they should join the same group and pay by the banknotes in the common group for security and performance.

## Repo
This repo is for educational and demonstration purposes.

There are two license files. The main file is the BSD 2-Clause License, and the other describes the details of the patent licenses.

The real code should run on a peer-to-peer network. On each peer there may be some users and a user can connect to multiple peers. Each user owns some private blockchains. They regard each blockchain as an object (NFT) and can trasfer them to others freely.

To run on a real P2P network, the method Peer.Broadcast in peer.js should be overloaded to send messages to neighbors via network protocols. The current code here is simplyfied for [the single page demo](https://saintthor.github.io/aob/play_en.html).

