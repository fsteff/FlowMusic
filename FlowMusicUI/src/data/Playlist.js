class Playlist{
    constructor(){
        this.songs = [];

        this.currentPos = 0;
    }

    next(){
        if(this.songs.length <= this.currentPos+1){
            return null;
        }else{
            this.currentPos++;
            return this.songs[this.currentPos];
        }
    }

    add(song){
        this.songs.push(song);
    }

    current(){
        return this.songs[this.currentPos];
    }


}

export default Playlist;
