const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

module.exports = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    type: 'number',
    describe: 'port to bind server',
    default: 8080,
  })
  .option('device', {
    alias: 'd',
    type: 'string',
    describe: 'name of audio device to use [default: system input]',
  })
  .option('channels', {
    alias: 'c',
    type: 'number',
    describe: 'channel count (1=mono, 2=stereo, etc)',
    default: 1,
  })
  .option('samplerate', {
    alias: 's',
    type: 'number',
    describe: 'sample rate in Hz [default: device sample rate]',
  })
  .option('bitdepth', {
    alias: 'b',
    type: 'number',
    describe: 'bit depth in bits',
    default: 16,
  })
  .option('encoding', {
    alias: 'e',
    type: 'string',
    describe: 'audio encoding (signed-integer,floating-point)',
    default: 'signed-integer',
  })
  .option('latency', {
    alias: 'l',
    type: 'number',
    describe: 'delay in milliseconds (determines packet size)',
    default: 1000,
  })
  .option('gaindb', {
    alias: 'g',
    type: 'number',
    describe: 'gain to apply to signal in decibels (negative attenuates, positive amplifies)',
  })
  .option('debug', {
    type: 'count',
    describe: 'output verbose debug info',
  })
  .help()
  .alias('h', 'help')
  .argv
