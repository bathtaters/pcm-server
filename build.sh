#!/bin/sh
set -e # Abort script on error


# Directory that npm build builds to
compiledir="./compiled"

# Location of package.json
pkgfile="./package.json"

# OS suffix to append to filename
ossuffix="$1"


#### SCRIPT ####
TAREXT="tgz"

# Make filename from pkg
package=$(cat "$pkgfile")
filename=$(osascript -l 'JavaScript' -e "var p = JSON.parse(\`$package\`); p.name+\`-\`+p.version+\`-$ossuffix\`;")

# Check & prompt to overwrite file
if [ -f "./$filename.$TAREXT" ]; then
    read -r -p "> WARNING: $filename.$TAREXT already exists, overwrite? [y/n] " response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Cancelling build."
        exit 1
    fi
fi

# Compile app
echo "> Compiling $filename..."
npx pkg "$pkgfile"

# Rename and compress compiledir
echo "> Compressing $filename to .$TAREXT..."
mv "$compiledir" "./$filename"
tar -caf "$filename.$TAREXT" "$filename"
mv "./$filename" "./$compiledir"

echo
echo "Build completed, source code ready for release."