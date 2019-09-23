'use strict';

(function() {
  const videoplay = document.querySelector('video#player');

  const recvideo = document.querySelector('video#recplayer');
  const btnRecord = document.querySelector('button#record');
  const btnPlay = document.querySelector('button#recplay');
  const btnDownload = document.querySelector('button#download');

  let buffer;
  let mediaRecorder;

  function getMediaStream(stream) {
    window.stream = stream;
    videoplay.srcObject = stream;
  }

  function handleError(err) {
    alert('getUserMedia error:' + err.toString());
  }

  function start() {
    if (!navigator.mediaDevices ||
      !navigator.mediaDevices.getDisplayMedia
    ) {
      alert('getDisplayMedia is not supported');
      return;
    } else {
      const constraints = {
        video: {
          width: 1280,
          height: 720,
          frameRate: 15
        },
        audio: false
      };

      navigator.mediaDevices.getDisplayMedia(constraints)
        .then(getMediaStream)
        .catch(handleError);
    }
  }

  start();

  function handleDataAvailable(e) {
    if (e && e.data && e.data.size > 0) {
      buffer.push(e.data);
    }
  }

  function startRecord() {
    buffer = [];

    const options = {
      mimeType: 'video/webm;codecs=vp8'
    };

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      alert(options.mimeType + ' is not supported!');
      return;
    }

    try {
      mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
      alert('Failed to create MediaRecorder:' + e.toString());
      return;
    }

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);
  }

  function stopRecord() {
    mediaRecorder.stop();
  }

  btnRecord.onclick = function() {
    if (btnRecord.textContent === 'Start Record') {
      startRecord();
      btnRecord.textContent = 'Stop Record';
      btnPlay.disabled = true;
      btnDownload.disabled = true;
    } else {
      stopRecord();
      btnRecord.textContent = 'Start Record';
      btnPlay.disabled = false;
      btnDownload.disabled = false;
    }
  }

  btnPlay.onclick = function() {
    const blob = new Blob(buffer, { type: 'video/webm' });
    recvideo.src = window.URL.createObjectURL(blob);
    recvideo.srcObject = null;
    recvideo.controls = true;
    recvideo.play();
  }

  btnDownload.onclick = function() {
    const blob = new Blob(buffer, { type: 'video/webm' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    a.download = 'aaa.webm';
    a.click();
  }
})();
