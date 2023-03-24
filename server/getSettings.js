const { spawnSync } = require('child_process')
const { parse } = require('plist')
const getInputList = () => 
  parse(spawnSync('system_profiler',['SPAudioDataType', '-xml']).stdout.toString())
    [0]._items[0]._items
    .filter(({ coreaudio_device_input }) => coreaudio_device_input)


const getDefaults = ({
  device, channels, latency,
  sampleRate = '16000',
  bitdepth = '16',
  gaindb = null,
  endian = 'little',
  encoding = 'signed-integer',
  fileType = 'raw',
  debug = false
}) => ({ device, channels, sampleRate, bitdepth, gaindb, latency, endian, encoding, fileType, debug })


const clientSettings = ({ channels, bitdepth, sampleRate, encoding, latency }) => JSON.stringify({
  encoding: /float/i.test(encoding || '') ? `${bitdepth}bitFloat` : `${bitdepth || '16'}bitInt`,
  channels: +(channels || 1),
  sampleRate: +(sampleRate || 16000),
  flushingTime: +(latency || 1000),
})

  
module.exports = function checkSettings(settings) {
  const inputs = getInputList()

  // Get debug mode
  settings = getDefaults(settings)
  settings.debug = settings.debug && settings.debug !== 'false' && settings.debug
  
  // Get device info (Use default device if none specified)
  let inputData = settings.device ?
    inputs.find(({ _name }) => !settings.device.localeCompare(_name.slice(0,settings.device.length), undefined, { sensitivity: 'base' }) ) :
    inputs.find(({ coreaudio_default_audio_input_device }) => coreaudio_default_audio_input_device)
  
  if (!inputData) {
    console.error(`ERROR: Device "${settings.device || 'default system device'}" not found! Use --device from below list`)
    if (inputs.length) console.error(`\t- ${inputs.map(({ _name }) => _name).join('\n\t- ')}\n`)
    else console.error('\tNO INPUT DEVICES FOUND - You should be on a MacOS system with at least one audio input.\n')
    process.exit(1)
  }

  // Force known settings
  settings.device = inputData._name
  if (!settings.channels) settings.channels = inputData.coreaudio_device_input
  settings.sampleRate = inputData.coreaudio_device_srate

  // Fix 24-bit
  if (settings.bitdepth == 24) { settings.bitdepth = 32 }

  // Get client settings
  const client = clientSettings(settings)
  
  // Convert to strings
  if (settings.bitdepth)   settings.bitdepth   = settings.bitdepth.toString()
  if (settings.sampleRate) settings.sampleRate = settings.sampleRate.toString()

  // Get channel settings
  settings.channels = settings.channels != inputData.coreaudio_device_input ? +settings.channels : ''
  settings.trimChannels = settings.channels && settings.channels < inputData.coreaudio_device_input

  if (settings.debug) console.debug('* Using settings:',settings)
  return { server: settings, client }
}