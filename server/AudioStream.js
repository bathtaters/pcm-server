const { spawn } = require('child_process')
const { PassThrough, Transform } = require('stream')
const getSettings = require('./getSettings')
const onExit = require('./onExit')

class CustomStream extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk)
    callback()
  }
}

module.exports = function AudioStream(settings) {
  settings = getSettings(settings || process.env)
  const { device, channels, sampleRate, bitdepth, gaindb, endian, encoding, fileType, debug } = settings.server

  let stopListening = null
  let audioProcess = null
  let audioStream = new CustomStream()
  const infoStream = new PassThrough()
  const audioProcessOptions = { stdio: ['ignore', 'pipe', 'ignore'] }

  if(debug === 'verbose') {
    audioProcessOptions.stdio[2] = 'pipe'
    infoStream.on('data',  (data)  => console.debug("Received Info: " + data))
    infoStream.on('error', (error) => console.error("Error in Info Stream: " + error))
  }

  const result = {
    settings,
    getStream: () => audioStream,
    isRunning: () => Boolean(audioProcess),

    start() {
      if(audioProcess) return debug && console.error("Duplicate calls to start(): Audio stream already started!")
      
      if(debug === 'verbose') console.log(['sox',
        '-b', '24', '-e', 'signed-int',
        '-d', '-b', bitdepth, '--endian', endian,
        '-c', channels, '-r', sampleRate, '-e', encoding,
        '-t', fileType, debug === 'verbose' ? '-S' : '-q', '-n',
        ...(gaindb ? ['vol', gaindb, 'dB'] : []),
      ].join(' '))

      audioProcess = spawn('sox', [
        '-d', '-b', bitdepth, '--endian', endian,
        '-c', channels, '-r', sampleRate, '-e', encoding,
        '-t', fileType, debug === 'verbose' ? '-S' : '-q', '-',
        ...(gaindb ? ['vol', gaindb, 'dB'] : []),
      ], audioProcessOptions)

      audioProcess.on('exit', function(code, sig) {
        if(code != null && sig === null) {
          audioStream.emit('audioProcessExitComplete')
          console.warn("SoX has exited with code = %d", code)
        }
      })

      if(audioProcess.stderr) audioProcess.stderr.pipe(infoStream)
      else if(debug) console.info("Audio stream: started")
      audioProcess.stdout.pipe(audioStream)
      audioStream.emit('startComplete')
      stopListening = onExit(result.stop)
    },

    stop() {
      if(!audioProcess) return
      audioProcess.kill('SIGTERM')
      audioProcess = null
      audioStream.emit('stopComplete')
      if(debug) console.info("Audio stream: stopped")
      stopListening && stopListening()
    },

    pause() {
      if(!audioProcess) return
      audioProcess.kill('SIGSTOP')
      audioStream.pause()
      audioStream.emit('pauseComplete')
      if(debug) console.info("Audio stream: paused")
    },

    resume() {
      if(!audioProcess) return
      audioProcess.kill('SIGCONT')
      audioStream.resume()
      audioStream.emit('resumeComplete')
      if(debug) console.info("Audio stream: resumed")
    },
  }

  infoStream.on('end', () => {
    if (audioProcess) result.stop()
    if (debug) console.error("Info stream closed.")
  })

  return result
}

