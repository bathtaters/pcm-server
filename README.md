# **PCM Server**
Use to stream raw audio from an audio input device.

I recommend a latency of 10 for best performance with minimal latency.

----
## Get Started (For MacOS)
1. Download binary for MacOS
2. Route desired signal to currently selected Input device
    - Can be set via *System Preferences > Sound > Input*
    - Use something like ***Soundflower*** if you want to stream from a program
3. Run binary in terminal `/path/to/pcm-server -h`
    - Open Terminal and click and drag file into window, then add options and press enter to run
    - If you see *Permission denied* the first time you run you may need to allow execution using `chmod +x /path/to/pcm-server`
4. Navigate to `http://<Server IP Address>:<PORT>` on any device on your local network to view interface.
    - You can check your IP Address under *System Preferences > Network > Advanced > TCP/IP* (Ensure that your connection method ie. "WiFi" is selected)
    - The port number will be shown when you run the program
5. If you're experiencing issues, stop server w/ `Ctrl+C` and tweak options and confirm correct input device is selected
----
## CLI Options
|Option||Description|Type|Default|
|--|--|--|--|--|
|`-h`|`--help`|Show help and quit|[boolean]| |
| |`--version`|Show version number and quit|[boolean]| |
|`-p`|`--port`|Port to bind server|[number]|`8080`|
|`-c`|`--channels`|Channel count (1=mono, 2=stereo, etc)|[number]|`1`|
|`-s`|`--samplerate`|Sample rate in Hz|[number]|*via system*|
|`-b`|`--bitdepth`|Bit-depth in bits|[number]|`16`|
|`-e`|`--encoding`|Audio encoding: `signed-integer` OR `floating-point`|[string]|`signed-integer`|
|`-l`|`--latency`|Delay in milliseconds *(AKA packet size)*|[number]|`1000`|
|`-g`|`--gaindb`|Gain to apply in decibels *(negative attenuates, positive amplifies)*|[number]|`0`|
| |`--debug`|Output verbose debug info|[boolean]|`false`|

*NOTE: Always uses the default device selected by the OS.*


----

### **Dev Notes:**
 - Must have *SoX* installed: https://sox.sourceforge.net/ (or use `npm run getsox`)
 - Use `npm run custom|bin` script to save your own preferred settings
 - Run `npm -g install pkg` to allow compiling your own binaries
    - `Package.json:pkg.targets` to set binary targets
    - `Package.json:scripts.getsox` to set *SoX* binary version that gets bundled
