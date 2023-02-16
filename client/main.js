var connection, player,
  noSleep = new NoSleep(),
  url = 'ws://'+location.hostname+(location.port ? ':'+location.port : ''),
  debugTo = null;

function setUI(state) {
  /* set UI based on server response */
  var btn = document.getElementById('control');
  switch (state) {
    case 'READY':
    case 'PAUSE':
      player.audioCtx.suspend();
      btn.removeAttribute('disabled');
      btn.classList.replace('negative','positive') || btn.classList.add('positive');
      btn.innerHTML = 'Listen';
      break;
    case 'START':
    case 'RESUME':
      btn.removeAttribute('disabled');
      btn.classList.replace('positive','negative') || btn.classList.add('negative');
      btn.innerHTML = 'Pause';
      break;
    case 'STOP':
      btn.removeAttribute('disabled');
      btn.classList.remove('positive','negative');
      btn.innerHTML = 'Reload';
      break;
    default: console.warn('Recieved unrecognized status from server',state)
    case 'LOADING':
      btn.setAttribute('disabled','true')
      // btn.innerHTML = 'Loading';
  }
}

function setServer(state) {
  /* call server based on player state */
  switch (state) {
    case 'running':   return connection.send('stream:play');
    case 'interrupted':
    case 'suspended': return connection.send('stream:pause');
    case 'closed':
      connection && connection.close();
      player && player.destroy();
      player = null;
      connection = null;
  }
}

function flipPlayer(currentState) {
  /* toggle player based on current state */
  switch (currentState) {
    case 'ready': 
    case 'running':
      setUI('LOADING');
      noSleep.disable();
      return player.audioCtx.suspend().catch(function(err) { console.error('AudioContext error', err); });
    case 'suspended':
      setUI('LOADING');
      noSleep.enable();
      return player.audioCtx.resume().catch(function(err) { console.error('AudioContext error', err); });
    case 'closed':
      setUI('LOADING');
      noSleep.disable();
      return player.audioCtx.close().catch(function(err) { console.error('AudioContext error', err); });;
  }
}

function isConnected() {
  return connection && player && connection.readyState === WebSocket.OPEN && player.audioCtx.state !== 'closed';
}

function initConnection() {
  setUI('LOADING');
  if (!WebSocket) return window.alert('Error! This site requires WebSocket support.')

  connection = new WebSocket(url);

  connection.onmessage = function(msg) {
    /* rx audio data */
    if (msg.data instanceof Blob) {
      return msg.data.arrayBuffer().then(function(data) {
        if (player) player.feed(data);
        else console.warn('Audio data sent before format header.');
      });
    }

    /* rx state change */
    if (msg.data.charAt(0) !== '{') {
      debugTo && debugTo('Server: '+msg.data);
      return setUI(msg.data);
    }

    /* rx format data */
    player = new PCMPlayer(JSON.parse(msg.data));

    player.audioCtx.addEventListener('statechange', function(ev) {
      /* update server when player state changes */
      var state = (ev.target.state) || 'closed'
      debugTo && debugTo('Client: '+state);
      setServer(state);
    });

    /* setup gain slider */
    document.getElementById('gain').setAttribute('value', String(Math.round(player.gainNode.gain.value * 100)));
    
    /* put player in standby mode */
    debugTo && debugTo('Audio Format: '+msg.data);
    flipPlayer('ready');
    setUI('READY');
  }
  
  connection.addEventListener('open',  function() { connection.send('stream:info'); });
  connection.addEventListener('close', function() { setUI('STOP'); });
  connection.addEventListener('error', function() { console.error('WebSocket error'); flipPlayer('closed'); });
}




/* Setup */

debugTo && console.clear();
initConnection();

/* player controller */
document.getElementById('control').addEventListener('click', function() {
  // debugTo && debugTo('Clicked while:',isConnected() ? player.audioCtx.state : 'disconnected');
  if (!isConnected()) { initConnection(); }
  else { flipPlayer(player.audioCtx.state); }
});

/* volume adjutments */
document.getElementById('gain').addEventListener('change', function(ev) {
  player.volume(ev.target.value / 100);
  debugTo && debugTo('Volume set: ' + (ev.target.value / 100));
});

/* focusing page */
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible' && !isConnected()) { initConnection(); }
});