function MainView(){
    function Playlist(){
        var root = $("#mainwindow");
        var divpl = $('<table></table>');
        divpl.appendTo(root);
        var playlist = Central.getPlayer().getPlaylist();

        playlist.addListener(function(){
            var html = '<tr><th>Artist</th><th>Title</th></tr>';
            var songs = playlist.getSongs();
            for(var i = 0; i < songs.length; i++){
                html += "<tr><td>"+songs[i].artist+"</td><td>"+songs[i].title+"</td></tr>";
            }
            divpl.html(html);
        });
    }

    var pl = new Playlist();
}

$(document).ready(function(){
    var mainview = new MainView();
});
