const HASH_TIMES = 9999;
const CBC_ITERATIONS = 60000;

function ABuff2Base64( ab )
{
    return btoa( String.fromCharCode( ...new Uint8Array( ab )));
}

function Base642ABuff( b64 )
{
    let s = atob( b64 );
    let ua8 = new Uint8Array( s.length );
    for( let l = s.length; l-- > 0; )
    {
        ua8[l] = s.charCodeAt( l );
    }
    return ua8;
}

function UA2Str( ua )
{
    let Rslt = '';
    let len = ua.length;

    for( let i = 0; i < len; i++ )
    {
        let char = ua[i]
        let high = char >> 4;
        if( high < 8 )
        {
            Rslt += String.fromCharCode( char );
        }
        else if( high === 12 || high === 13 )
        {
            let char2 = ua[++i] & 0x3F;
            Rslt += String.fromCharCode((( char & 0x1F ) << 6 ) | char2 );
        }
        else if( high === 14 )
        {
            let char2 = ua[++i] & 0x3F;
            let char3 = ua[++i] & 0x3F;
            Rslt += String.fromCharCode((( char & 0x0F ) << 12 ) | ( char2 << 6 ) | char3 );
        }
    }
    return Rslt;
}

function Xor( ab0, ab1 )
{
    let ua0 = new Uint8Array( ab0 );
    let ua1 = new Uint8Array( ab1 );
    for( let i = 0; i < ab0.byteLength; i++ )
    {
        ua0[i] ^= ua1[i];
    }
    return ua0;
}

async function Hash( raw, hashName, times )
{
    times = times || 1
    let ua = typeof raw === 'string' ? new TextEncoder( 'utf8' ).encode( raw ) : raw;
    for( ; times-- > 0; )
    {
        ua = await crypto.subtle.digest( { name: hashName }, ua );
    }
    return ua
}

class User
{
    constructor( keys )
    {
        this.OwnChains = new Map();
        this.LocalBlocks = {};
        this.BlackList = [];
        this.Peers = new Map();
        let me = this;
        return ( async () =>
        {
            if( keys )  //load user from imported keys.
            {
                me.PubKeyStr = keys.public;
                me.PubKey = await crypto.subtle.importKey( "raw", Base642ABuff( keys.public ),
                                    { name: "ECDSA", namedCurve: "P-256", }, false, ["verify"]);
                me.PriKey = await crypto.subtle.importKey( "jwk", keys.private,
                                    { name: "ECDSA", namedCurve: "P-256", }, false, ["sign"] );
            }
            else        //new
            {
                let key = await crypto.subtle.generateKey( { name: "ECDSA", namedCurve: "P-256", }, true, ["sign", "verify"] );
                let raw = await crypto.subtle.exportKey( "raw", key.publicKey );
                me.PubKey = key.publicKey;
                me.PriKey = key.privateKey;
                me.PubKeyStr = ABuff2Base64( raw );
            }
            return me;
        } )();
    };

    get Id() { return this.PubKeyStr; };

    async Sign( s, pswd )
    {
        let ua8 = Base642ABuff( s );
        let sign = await crypto.subtle.sign( { name: "ECDSA", hash: { name: "SHA-1" }, }, this.PriKey, ua8 );
        return ABuff2Base64( sign );
    };

    static async Verify( sig, data, pubKeyS )
    {
        console.log( 'Verify', this, sig, data, pubKeyS );
        let pubK = await crypto.subtle.importKey( "raw", Base642ABuff( pubKeyS ),
                                { name: "ECDSA", namedCurve: "P-256", }, false, ["verify"] )
        return crypto.subtle.verify( { name: "ECDSA", hash: { name: "SHA-1" }, }, pubK, Base642ABuff( sig ), data );
    };

    static async Import( pswd, encrypted )    //import a key pair to create a user.
    {
        let h512 = await Hash( pswd, 'SHA-512', HASH_TIMES );
        let CBCKey = await crypto.subtle.importKey( 'raw', h512.slice( 0, 32 ), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'] )
                        .then( k => crypto.subtle.deriveKey( { "name": 'PBKDF2', "salt": h512.slice( 32, 48 ),
                                    "iterations": CBC_ITERATIONS, "hash": 'SHA-256' }, k,
                                    { "name": 'AES-CBC', "length": 256 }, true, ["encrypt", "decrypt"] ))
        let Buffer = await crypto.subtle.decrypt( { name: 'AES-CBC', iv: h512.slice( 48, 64 ) }, CBCKey, Base642ABuff( encrypted ));
        let Keys = JSON.parse( UA2Str( new Uint8Array( Buffer )));

        return await new User( Keys );
    };

    async Export( pswd )    //export the key pair.
    {
        let h512 = await Hash( pswd, 'SHA-512', HASH_TIMES );
        let CBCKey = await crypto.subtle.importKey( 'raw', h512.slice( 0, 32 ), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'] )
                        .then( k => crypto.subtle.deriveKey( { "name": 'PBKDF2', "salt": h512.slice( 32, 48 ),
                                    "iterations": CBC_ITERATIONS, "hash": 'SHA-256' }, k,
                                    { "name": 'AES-CBC', "length": 256 }, true, ["encrypt", "decrypt"] ))
        let ExPrivKey = await crypto.subtle.exportKey( "jwk", this.PriKey );
        let Buffer = new TextEncoder( 'utf8' ).encode( JSON.stringify( { 'private': ExPrivKey, 'public': this.PubKeyStr } ));

        return ABuff2Base64( await crypto.subtle.encrypt( { name: 'AES-CBC', iv: h512.slice( 48, 64 ) }, CBCKey, Buffer ));
    };

    async CreateBlock( parentIdx, data, parentId )
    {
        let block = await new Block( parentIdx + 1, data, parentId );
        block.Id = await this.Sign( block.Hash );
        return block;
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
            this.OwnChains.delete( Root.Id );
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
