class Peer
{
    constructor( id )
    {
        this.Id = 'peer' + id;
        this.Users = new Map();
        this.Neighbors = new Map();
    };

    AddUser( u )
    {
        this.Users.set( u.Id, u );
        u.Peers.set( this.Id, this );
    };

    DelUser( userId )
    {
        if( this.Users.has( userId ))
        {
            this.Users.get( userId ).Peers.delete( this.Id );
            this.Users.delete( userId );
        }
    };

    AddNeighbors( neighbors )
    {
        for( let n of neighbors.filter( n => n.Id != this.Id ))
        {
            this.Neighbors.set( n.Id, n );
        }
    };

    async Broadcast( block )  //inner & outer
    {
        console.log( 'Peer.Broadcast in', this.Id );
        return ( await Promise.all(( [this].concat( [...this.Neighbors.values()] )).map( p => p.Receive( block )
                    .catch( e => { console.log( e ) } )))).reduce(( x, y ) => x.concat( y ));
    };

    async Receive( block )
    {
        console.log( 'Peer.Receive in', this.Id, block.Id );
        let Info = []
        //allSettled 与 all 的返回值不同
        await Promise.allSettled( [...this.Users.values()].map( u => u.RcvBlock( block ).catch( e =>
        {
            console.log( 'Receive error：', e );
            Info.push( [u.Id, block.Id, e] );
        } )));
        //console.log( 'Peer.Received', this.Id, Info );
        return Info
    };
}

