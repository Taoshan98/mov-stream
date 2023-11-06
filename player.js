function play_stream(url) {
    let video = document.getElementById('video');
    let source = document.createElement('source');

    source.setAttribute('src', url);
    source.setAttribute('type', 'video/mp4');
    video.appendChild(source);
    video.play();
}

let url = window.location.href.split("#")[1];
play_stream(url);
