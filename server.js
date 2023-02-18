const args = require('./server/getArgs')

const WebSocket = require('ws')
const express = require('express')
const AudioStream = require('./server/AudioStream')
const getSettings = require('./server/getSettings')

const app = express()
const server = app.listen(args.port || 8080, () => { console.info('Listening on port',args.port || 8080) })
const wss = new WebSocket.Server({ server })

app.use(express.static(__dirname + '/client'))

const streamSettings = getSettings(args || {})

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress
  console.info('Connected to',ip)
  
  const audio = AudioStream(streamSettings)
  const stream = audio.getStream()
  
  ws.on('message', (msg) => {
    msg = msg.toString()
    if (args.debug) console.info('Recieved message:',msg,'from',ip)
    switch (msg) {
      case 'stream:info':   return ws.send(audio.settings.client)
      case 'stream:start':  return audio.start()
      case 'stream:pause':  return audio.pause()
      case 'stream:resume': return audio.resume()
      case 'stream:stop':   return audio.stop()
      case 'stream:play':   return audio.isRunning() ? audio.resume() : audio.start()
    }
  })
  ws.on('close', () => {
    console.info('Disconnected from',ip)
    audio.stop()
  })

  stream.on('readable', () => { audio.getStream() && ws.send(stream.read()) })
  stream.on('startComplete',  () => { ws.send('START')  })
  stream.on('stopComplete',   () => { ws.send('STOP')   })
  stream.on('pauseComplete',  () => { ws.send('PAUSE')  })
  stream.on('resumeComplete', () => { ws.send('RESUME') })
})
