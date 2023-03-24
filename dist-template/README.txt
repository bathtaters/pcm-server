Use to stream raw audio from an audio input device. (Only works on MacOS currently)

Distributed under the MIT License by bathtaters

Relies on SoX - Sound eXchange - https://sox.sourceforge.net/
NOTE: This software does not include SoX, user must install it separately in order for this to work.

Repository: https://github.com/bathtaters/pcm-server/


-----------------------
Get Started (For MacOS)
-----------------------
1. Download the pcm-server binary
2. Download and install SoX from https://sox.sourceforge.net/
    - For simple install go to: https://sourceforge.net/projects/sox/files/sox/
    - Find latest version, download MacOS zip file and unzip, move file `sox` to `/usr/local/bin/`
    - Confirm it works by typing `sox --version` you should see SoX + the version number
3. Route desired signal to currently selected Input device
    - Can be set via *System Preferences > Sound > Input*
    - Use something like ***Soundflower*** if you want to stream from a program
4. Run binary in terminal `/path/to/pcm-server -h`
    - Open Terminal and click and drag file into window, then add options and press enter to run
    - If you see *Permission denied* the first time you run you may need to allow execution using `chmod +x /path/to/pcm-server`
5. Navigate to `http://<Server IP Address>:<PORT>` on any device on your local network to view interface.
    - You can check your IP Address under *System Preferences > Network > Advanced > TCP/IP* (Ensure that your connection method ie. "WiFi" is selected)
    - The port number will be shown when you run the program
6. If you're experiencing issues, stop server w/ `Ctrl+C` and tweak options and confirm correct input device is selected


-----------
CLI Options
-----------
Option			Description			        Type		Default
------------------------------------------------------------------------------
-h  --help		Show help and quit		    [boolean]
    --version	Show version and quit	    [boolean]
-d  --device    Audio device to use         [string]    (system input)
            (Name from sound menu)
-p  --port		Port to bind server		    [number]	8080
-c  --channels 	Channel count			    [number]	1
			 (1 = mono, 2 = stereo, etc)
-s  --samplerate	Sample rate in Hz	    [number]	(match device)
-b  --bitdepth	Bit-depth in bits		    [number]	16
-e  --encoding	Audio encoding		        [string]	signed-integer
			 (signed-integer OR floating-point)
-l  --latency	Delay in milliseconds	    [number]	1000
			 (sets packet size)
-g  --gaindb	Gain to apply in decibels	[number]	0
			 (negative attenuates, positive amplifies)
    --debug		Output verbose debug info	[boolean]	false


-------
Credits
-------

Code adapted or directly used from the following projects:
 - https://github.com/Ivan-Feofanov/ws-audio-api
 - https://github.com/samirkumardas/pcm-player
 - https://github.com/richtr/NoSleep.js
 - Relies on unbundled dependency: SoX - Sound eXchange - https://sox.sourceforge.net/