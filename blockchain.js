
class Block
{
    constructor( index, data, prevId, id, content )
    {
        //console.log( index, data, prevId );
        this.Index = index;
        if( id )    // for rebuild
        {
            this.id = id;
            this.Content = content;
            return this;
        }
        let TimeStr = new Date().Format();
        this.id = '';
        this.Content = [index, TimeStr, data, prevId || ''].join( '\n' );
        let me = this;
        return ( async () =>
        {
            let hash = await Hash( me.Content, 'SHA-1' )
            me.Hash = ABuff2Base64( hash );
            if( me.Index === 0 )
            {
                me.Id = me.Hash;
            }
            return me;
        } )();
    };

    Copy()
    {
        return { Id: this.Id, Content: this.Content, Index: this.Index };
    };

    async ChkRoot()   //根区块的 Id 是哈希值，后续区块是签名值，验证方式不同。
    {
        let Id = this.Id;
        let hash = await Hash( this.Content, 'SHA-1' );
        return Id == ABuff2Base64( hash );
    };

    GetPrevId()
    {
        console.assert( this.Index != 0 );
        let Lines = this.Content.split( '\n' );
        return Lines[4];
    };

    GetOwnerId()
    {
        let Lines = this.Content.split( '\n' );
        return Lines[3];
    };

    async ChkFollow( pubKeyS )
    {
        let hash = await Hash( this.Content, 'SHA-1' )
        return await User.Verify( this.Id, hash, pubKeyS );
    };

    get Id() { return this.id; };
    set Id( id )
    {
        this.id = this.id || id;
    };
}

class BlockChain
{
    constructor( name, firstOwner )
    {
        this.Name = name;
        let me = this;
        return ( async () =>
        {
            let FirstBlock = await new Block( 0, [name, firstOwner].join( '\n' ));
            me.Blocks = [FirstBlock];
            me.Id = FirstBlock.Id;
            return me;
        } )();
    };
}
