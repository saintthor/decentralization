class User
{
    constructor( name, pswd )
    {
        this.Name = name;
        this.OwnChains = new Map();
        this.LocalBlocks = {};
        this.BlackList = [];
        let me = this;
        return ( async () =>
        {
            let key = await crypto.subtle.generateKey( { name: "ECDSA", namedCurve: "P-256", }, true, ["sign", "verify"] );
            let raw = await crypto.subtle.exportKey( "raw", key.publicKey );
            me.PubKey = key.publicKey;
            me.PriKey = key.privateKey;
            me.PubKeyStr = ABuff2Base64( raw );
            return me;
        } )();
    };

    get Id() { return this.PubKeyStr; };

    async Sign( s, pswd )
    {
        let ua8 = Base642ABuff( s );
        return await crypto.subtle.sign( { name: "ECDSA", hash: { name: "SHA-1" }, },
                                    this.PriKey, ua8 );
    };

    static async Verify( sig, data, pubKeyS )
    {
        console.log( 'Verify', this, sig, data, pubKeyS );
        let pubK = await crypto.subtle.importKey( "raw", Base642ABuff( pubKeyS ),
                                { name: "ECDSA", namedCurve: "P-256", }, false, ["verify"] )
        return crypto.subtle.verify( { name: "ECDSA", hash: { name: "SHA-1" }, }, pubK, Base642ABuff( sig ), data );
    };

    FindRoot( blockId )
    {
        let Lines = this.LocalBlocks[blockId].Content.split( '\n' );
        if( Lines[0] == 0 )
        {
            return { Id: blockId, Name: Lines[2] };
        }
        return this.FindRoot( Lines[4] );
    };

    async RcvBlock( block )
    {
        if( this.LocalBlocks[block.Id] )
        {
            if( this.LocalBlocks[block.Id].Content !== block.Content )
            {
                throw "bad block data.";
            }
            return;
        }

        let Lines = block.Content.split( '\n' );
        if( Lines[0] > '0' )
        {
            let PrevBlock = this.LocalBlocks[Lines[4]];
            let PrevLines = PrevBlock.Content.split( '\n' );
            if( this.BlackList.filter( uid => uid == PrevLines[3] ).length > 0 )
            {
                if( this.Id != PrevLines[3] )
                {
                    throw "sender in blacklist.";
                }
                return;
            }
            if( !this.ChkTail( PrevBlock ))
            {
                this.BlackList.push( PrevLines[3] );
                //let BlackName = V.GetUser( PrevLines[3] ).Name;
                if( this.Id != PrevLines[3] )
                {
                    throw "double spending."
                }
                return;
            }
        }

        let RecvBlock = new Block( block.Index, 0, 0, block.Id, block.Content );
        if( block.Content[0] === '0' )
        {
            //console.log( 'recv new root', Lines[3], this.Id );
            if( !await RecvBlock.ChkRoot())
            {
                throw "verify failed.";
            }
        }
        else
        {
            let prevId = RecvBlock.GetPrevId();
            let Prev = prevId ? this.LocalBlocks[prevId] : null;
            if( !Prev )
            {
                throw "previous block not found.";
            }
            let PrevBlock = new Block( Prev.Index, 0, 0, Prev.Id, Prev.Content );
            console.log( prevId, PrevBlock );
            let prevOwnerId = PrevBlock.GetOwnerId();    // Id is PubKeyStr
            if( !await RecvBlock.ChkFollow( prevOwnerId ))
            {
                throw "verify failed."
            }
        }
        let NewBlock = this.LocalBlocks[block.Id] = RecvBlock;
        let Root = this.FindRoot( block.Id );
        NewBlock.ChainId = Root.Id;
        if( Lines[3] === this.Id )
        {
            this.OwnChains.set( Root.Id, Root );
        }
        else
        {
            //console.log( Root.Id, this.OwnChains );
            this.OwnChains.delete( Root.Id );
            //console.log( this.OwnChains.length );
        }
    };

    GetChainBranch( chainid )
    {
        let Branch = [];
        let Queue = [this.LocalBlocks[chainid]];
        let Index = 0;
        let InChains = [];
        for( let id in this.LocalBlocks )
        {
            if( this.LocalBlocks[id].ChainId == chainid )
            {
                InChains.push( this.LocalBlocks[id] );
            }
        }
        //逐层添加区块，以后加分叉
        console.log( InChains );
        while( Queue )
        //for( let i = 0; i++ < 5; )
        {
            let CurBlock = Queue.splice( 0, 1 )[0];
            console.log( Queue.length, CurBlock );
            if( !CurBlock )
            {
                break;
            }
            Branch.push( CurBlock );
            let Follows = InChains.filter( b => b.Index == CurBlock.Index + 1 &&
                                                b.Content.split( '\n' )[4] == CurBlock.Id );
            //console.log( CurBlock, Follows );
            for( let follow of Follows )
            {
                Queue.push( follow );
                //console.log( follow );
            }
        }
        console.log( 'GetChainBranch', this.Name, Branch );
        return Branch;
    };

    ChkTail( block )
    {
        for( let id in this.LocalBlocks )
        {
            if( this.LocalBlocks[id].Content.split( '\n' )[4] == block.Id )
            {
                return false;
            }
        }
        return true;
    };
}
