'use strict';

(function() {
  const mediaStreamConstraints = {
    video: true,
  };

  const offerOptions = {
    offerToReceiveVideo: 1,
  };

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const startButton = document.getElementById('startButton');
  const callButton = document.getElementById('callButton');
  const hangupButton = document.getElementById('hangupButton');
  const messageList = document.getElementById('messages');

  callButton.disabled = true;
  hangupButton.disabled = true;

  startButton.addEventListener('click', startAction);
  callButton.addEventListener('click', callAction);
  hangupButton.addEventListener('click', hangupAction);

  let localStream;
  let remoteStream;

  let localPeerConnection;
  let remotePeerConnection;

  function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);
    const msg = `${now} ${text}`;

    const li = document.createElement('li');
    li.innerText = msg;
    messageList.appendChild(li);

    console.log(now, text);
  }

  function gotLocalMediaStream(mediaStream) {
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
    trace('Received local stream.');
    callButton.disabled = false;    
  }

  function gotRemoteMediaStream(event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    trace('Remote peer connection received remote stream.');
  }

  function handleLocalMediaStreamError(error) {
    trace(`navigator.mediaDevices.getUserMedia error: ${error.toString()}.`);
  }

  function handleConnection(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      const otherPeer = getOtherPeer(peerConnection);

      otherPeer.addIceCandidate(newIceCandidate)
        .then(() => handleConnectionSuccess(peerConnection))
        .catch(error => handleConnectionFailure(peerConnection, error));

      trace(`${getPeerName(peerConnection)} ICE candidate:\n${iceCandidate.candidate}.`);
    }
  }

  function handleConnectionChange(event) {
    const peerConnection = event.target;
    trace('ICE state change event: ' + event);
    trace(`${getPeerName(peerConnection)} ICE state: ${peerConnection.iceConnectionState}.`);
  }

  function handleConnectionSuccess(peerConnection) {
    trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
  }

  function handleConnectionFailure(peerConnection, error) {
    trace(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n${error.toString()}.`);
  }

  function createdOffer(description) {
    trace(`Offer from localPeerConnection:\n${description.sdp}`);

    trace('localPeerConnection setLocalDescription start.');
    localPeerConnection.setLocalDescription(description)
      .then(() => setLocalDescriptionSuccess(localPeerConnection))
      .catch(setSessionDescriptionError);

    trace('remotePeerConnection setRemoteDescription start.');
    remotePeerConnection.setRemoteDescription(description)
      .then(() => setRemoteDescriptionSuccess(remotePeerConnection))
      .catch(setSessionDescriptionError);

    trace('remotePeerConnection createAnswer start.');
    remotePeerConnection.createAnswer()
      .then(createdAnswer)
      .catch(setSessionDescriptionError);
  }

  function createdAnswer(description) {
    trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

    trace('remotePeerConnection setLocalDescription start.');
    remotePeerConnection.setLocalDescription(description)
      .then(() => setLocalDescriptionSuccess(remotePeerConnection))
      .catch(setSessionDescriptionError);

    trace('localPeerConnection setRemoteDescription start.');
    localPeerConnection.setRemoteDescription(description)
      .then(() => setRemoteDescriptionSuccess(localPeerConnection))
      .catch(setSessionDescriptionError);
  }

  function setDescriptionSuccess(peerConnection, functionName) {
    const peerName = getPeerName(peerConnection);
    trace(`${peerName} ${functionName} complete.`);
  }

  function setLocalDescriptionSuccess(peerConnection) {
    setDescriptionSuccess(peerConnection, 'setLocalDescription');
  }

  function setRemoteDescriptionSuccess(peerConnection) {
    setDescriptionSuccess(peerConnection, 'setRemoteDescription');
  }

  function setSessionDescriptionError(error) {
    trace(`Failed to create session description: ${error.toString()}.`);
  }

  function getOtherPeer(peerConnection) {
    return (peerConnection === localPeerConnection) ?
      remotePeerConnection : localPeerConnection;
  }

  function getPeerName(peerConnection) {
    return (peerConnection === localPeerConnection) ?
      'localPeerConnection' : 'remotePeerConnection';
  }

  function startAction(e) {
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then(gotLocalMediaStream)
      .catch(handleLocalMediaStreamError);
    trace('Requesting local stream.');
  }

  function callAction(e) {
    callButton.disabled = true;
    hangupButton.disabled = false;

    trace('Start calling.');

    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
      trace(`Using video device: ${videoTracks[0].label}.`);
    }
    if (audioTracks.length > 0) {
      trace(`Using audio device: ${audioTracks[0].label}.`);
    }

    const servers = null;

    localPeerConnection = new RTCPeerConnection(servers);
    trace('Created local peer connection object localPeerConnection.');

    localPeerConnection.addEventListener('icecandidate', handleConnection);
    localPeerConnection.addEventListener(
      'iceconnectionstatechange', handleConnectionChange
    );

    remotePeerConnection = new RTCPeerConnection(servers);
    trace('Created remote peer connection object remotePeerConnection.');

    remotePeerConnection.addEventListener('icecandidate', handleConnection);
    remotePeerConnection.addEventListener(
      'iceconnectionstatechange', handleConnectionChange
    );
    remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);

    localPeerConnection.addStream(localStream);
    trace('Added local stream to localPeerConnection.');

    trace('localPeerConnection createOffer start.');
    localPeerConnection.createOffer(offerOptions)
      .then(createdOffer)
      .catch(setSessionDescriptionError);
  }

  function hangupAction(e) {
    localPeerConnection.close();
    localPeerConnection = null;

    remotePeerConnection.close();
    remotePeerConnection = null;

    hangupButton.disabled = true;
    callButton.disabled = false;
    trace('Ending call.');
  }
})();