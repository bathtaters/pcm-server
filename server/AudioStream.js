const { spawn, spawnSync } = require('child_process')
const { PassThrough, Transform } = require('stream')
const onExit = require('./onExit')

const SOX_LOCATIONS = [ './sox', 'sox', '/usr/local/bin/sox' ]
const AUDIO_DRIVER = 'coreaudio' // MacOS-specific option

// Check for SoX binary is installed
const soxPath = SOX_LOCATIONS.find((s) => spawnSync(s, ['--version'], { encoding: 'utf-8' }).stdout)
if (!soxPath) {
  console.error('ERROR: SoX binary is missing. Install from https://sox.sourceforge.net/')
  process.exit(1)
}

// Options for SoX binary
const getSoxOptions = ({ device, channels, trimChannels, sampleRate, bitdepth, gaindb, endian, encoding, fileType, debug }) => [
  '-t', AUDIO_DRIVER, device, '-t', fileType,
  '-b', bitdepth, '-r', sampleRate,
  '-e', encoding, '--endian', endian,
  debug ? '-S' : '-q', '-',
  ...(gaindb ? ['vol', gaindb, 'dB'] : []),
  ...(!channels ? [] : 
    trimChannels ?
    ['remix'].concat([...Array(channels)].map((_,i) => `${i+1}`)) :
    ['channels', `${channels}`]
  ),
]

class CustomStream extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk)
    callback()
  }
}

module.exports = function AudioStream(settings) {
  const { debug } = settings.server
  const soxOpts = getSoxOptions(settings.server)

  let stopListening = null
  let audioProcess = null
  let audioStream = new CustomStream()
  const infoStream = new PassThrough()
  const audioProcessOptions = { stdio: ['ignore', 'pipe', 'ignore'] }

  if(debug) {
    audioProcessOptions.stdio[2] = 'pipe'
    infoStream.on('data',  (data)  => console.debug("  * Received Info: " + data))
    infoStream.on('error', (error) => console.error("ERROR in Info Stream: " + error))
  }

  const result = {
    settings,
    getStream: () => audioStream,
    isRunning: () => Boolean(audioProcess),

    start() {
      if(audioProcess) return debug && console.warn("! Duplicate calls to start(): Audio stream already started!")

      if(debug) console.log('*', soxPath, soxOpts.join(' '))
      audioProcess = spawn(soxPath, soxOpts, audioProcessOptions)

      audioProcess.on('exit', function(code, sig) {
        if(code != null && sig === null) {
          audioStream.emit('audioProcessExitComplete')
          console.warn("! SoX has exited with code = %d", code)
        }
      })

      if(audioProcess.stderr) audioProcess.stderr.pipe(infoStream)
      else if(debug) console.debug("  * Audio stream: started")
      audioProcess.stdout.pipe(audioStream)
      audioStream.emit('startComplete')
      stopListening = onExit(result.stop)
    },

    stop() {
      if(!audioProcess) return
      audioProcess.kill('SIGTERM')
      audioProcess = null
      audioStream.emit('stopComplete')
      if(debug) console.debug("  * Audio stream: stopped")
      stopListening && stopListening()
    },

    pause() {
      if(!audioProcess) return
      audioProcess.kill('SIGSTOP')
      audioStream.pause()
      audioStream.emit('pauseComplete')
      if(debug) console.debug("  * Audio stream: paused")
    },

    resume() {
      if(!audioProcess) return
      audioProcess.kill('SIGCONT')
      audioStream.resume()
      audioStream.emit('resumeComplete')
      if(debug) console.debug("  * Audio stream: resumed")
    },
  }

  infoStream.on('end', () => {
    if (audioProcess) result.stop()
    if (debug) console.debug("  * Info stream closed.")
  })

  return result
}

