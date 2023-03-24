const { networkInterfaces } = require('os')

let ips = []

const ipMatch = /^\d{3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
const localhost = /^127\./

for (const interfaceList of Object.values(networkInterfaces())) {
    for (const interface of interfaceList) {
        if (
            (interface.family === 'IPv4' || interface.family === 4) &&
            typeof interface.address === 'string' &&
            ipMatch.test(interface.address) &&
            !localhost.test(interface.address)
        ) {
            ips.push(interface.address)
        }
    }
}

module.exports = ips[0] || 'localhost'