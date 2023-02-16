const { spawnSync } = require('child_process')
const getInputList = () => 
  JSON.parse(spawnSync('system_profiler',['SPAudioDataType', '-json']).stdout.toString())
    .SPAudioDataType[0]._items
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
  
  // Get default device
  if (!settings.device) settings.device = inputs.find(({ coreaudio_default_audio_input_device }) => coreaudio_default_audio_input_device)._name

  // Check settings list for device
  const inputData = inputs.find(({ _name }) => settings.device.toLowerCase() === _name.toLowerCase())
  if (!inputData) {
    console.error(inputs.map(({ _name }) => _name))
    throw new Error(`${settings}: Device not found! Copy inputSettings.device from above list.`)
  }

  // Force known settings
  settings.device = inputData._name
  if (!settings.channels || settings.channels > inputData.coreaudio_device_input) {
    if (settings.channels) console.warn(`Trimmed invalid channel count: ${settings.channels} to ${inputData.coreaudio_device_input}`)
    settings.channels = inputData.coreaudio_device_input
  }
  settings.sampleRate = inputData.coreaudio_device_srate

  // Convert to strings
  if (settings.channels)   settings.channels   = settings.channels.toString()
  if (settings.bitdepth)   settings.bitdepth   = settings.bitdepth.toString()
  if (settings.sampleRate) settings.sampleRate = settings.sampleRate.toString()

  // Fix 24-bit
  if (settings.bitdepth === '24') { settings.bitdepth = '32' }

  if (settings.debug) console.info('Using settings:',settings)
  return { server: settings, client: clientSettings(settings) }
}