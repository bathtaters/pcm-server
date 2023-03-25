const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const pkg = require('../package.json')

// Filename Enum
const filenames = {
    change: 'CHANGELOG',
    readme: 'README.txt',
    license: 'LICENSE.txt',
    release: 'Release.md',
    self: path.basename(__filename),
}

// Paths
const sourceDir = __dirname
const destDir = process.argv[2] && path.join(sourceDir,'..',process.argv[2])






// MAIN METHOD

function main() {
    
    // Get file contents
    const files = loadFiles(sourceDir, [filenames.self, filenames.release])
    
    // Get versions
    const currentVersion = pkg.version, prevVersion = lastVersion(files[filenames.change])

    // Get commit list
    const commits = getCommits(changeFormat, prevVersion)
    
    // If versions mismatch, update changelog
    const updateLog = updateChangelog(sourceDir, prevVersion, currentVersion, files[filenames.change], commits)
    if (updateLog) files[filenames.change] = updateLog

    // Update release docs
    updateRelease(sourceDir, currentVersion, commits)
    
    // If no argument provided, quit
    if (!destDir) return console.log('No destination provided, skipping file updates.')

    // Create dir
    fs.mkdirSync(destDir, { recursive: true })

    // Update Readme Header
    files[filenames.readme] = updateReadme(files[filenames.readme], currentVersion)

    // Copy all files to destination
    saveFiles(destDir, files)

    console.log('Finished updating version info')
}

// COPY FILES
function saveFiles(toDir, fileObj) {
    console.log(`Updating files in ${path.basename(toDir)}...`)
    for (const filename in fileObj) {
        console.log('   Saving',filename)
        saveFile(toDir, filename, fileObj[filename])
    }
}


// README OPTIONS

const readmeHdr = (version) =>
`*******************
PCM Server - v${version}
*******************\n\n`

function updateReadme(text, version) {
    console.log('Updating version number in Readme')
    return readmeHdr(version) + text
}


// GITHUB OPTIONS

const releaseReadme = (version, commits) =>
`# PCM Server - v${version}
### Use to stream raw audio from an audio input device.

This version only works on a MacOS x64 server

----

### Updates
${commits.replace(/\t/g,' ')}

----

Relies on SoX - Sound eXchange - https://sox.sourceforge.net/
NOTE: This software does not include SoX, user must install it separately in order for this to work.
`

function updateRelease(dir, version, commits) {
    if (!commits.trim()) return console.log('No new commits, skipping release doc updates.')
    console.log('Updating release docs to', version)
    saveFile(dir, filenames.release, releaseReadme(version, commits))
}


// CHANGELOG OPTIONS

const changeFormat = '\t- %s' // git log pretty=format:"$changeFormat"

const changeHdr = (version, date = new Date()) =>
`\n\n---------------------------------------------
v${version} - ${date.toLocaleDateString('en-US',{ dateStyle: 'short' })}\n`

function updateChangelog(dir, fromV, toV, oldChangelog, commits) {
    if (fromV === toV) return console.log('Skipping changelog, already updated to',toV)

    console.log('Updating changelog from',fromV,'to',toV)
    const newLog = oldChangelog + changeHdr(toV) + commits
    saveFile(dir, filenames.change, newLog)

    runCommand(`git add "${path.join(dir,filenames.change)}"`)
    runCommand(`git commit -m "updated to v${toV}"`)

    return newLog
}



// HELPERS

function runCommand(command, options = []){
    // MAC OS Specific
    return execSync(command,options).toString('utf-8')
}

function loadFiles(dir, ignoreList = []) {
    ignoreList = ignoreList.map((fn) => fn.toLowerCase())

    const filenames = fs.readdirSync(dir)
        .filter((fn) => !ignoreList.includes(fn.toLowerCase()))
    
    let files = {}
    for (const fname of filenames) {
        files[fname] = fs.readFileSync(path.join(dir, fname)).toString('utf-8')
    }

    return files
}

function saveFile(dir, filename, data) {
    fs.writeFileSync(path.join(dir,filename), data)
}

function lastVersion(changelog) {
    const vLineRegex = /^v(\d+\.\d+\.\d+)\s/

    let vLine = changelog.split('\n').reverse().find(
        (line) => vLineRegex.test(line)
    )

    return vLine && vLine.match(vLineRegex)?.[1]
}

const commitFilterRegex = /[v\s]\d+\.\d+\.\d+/
function getCommits(format, fromVersion, toVersion = '') {
    const commits = runCommand(`git log v${fromVersion}..${toVersion ? 'v' : ''}${toVersion} --pretty=format:"${format}"`)
        .split('\n')
    return commits.filter((commit) => !commitFilterRegex.test(commit)).join('\n')
}

// Run
main()