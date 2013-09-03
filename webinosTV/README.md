# Platform prerequisites

## MediaContent API

```
# $ cd $webinos-pzp-path/node_modules
$ git clone https://github.com/webinos/webinos-api-mediaContent.git
$ cd webinos-api-mediaContent
$ npm install
# In addition you need to install mediainfo (CLI)
$ brew install mediainfo 
```

Notice: To avoid your System Media folders to be scanned (which may take long), 
you may alternatively create an folder on your Desktop called ```Media``` and 
put a ```Music```, ```Pictures``` and ```Movies``` subfolders in it.
Then alter ```$webinos-pzp-path/node_modules/webinos-api-mediaContent/lib/mediacontent_mediainfo.js```
to scan from this loaction:
```
    var home = os.type().toLowerCase() === "windows_nt" ? "userprofile" : "HOME";
    var music = path.resolve(process.env[home], "Desktop", "Media", "Music"),
        video = path.resolve(process.env[home], "Desktop", "Media", "Videos"),
        pictures = path.resolve(process.env[home], "Desktop", "Media", "Pictures");

    if (os.type().toLowerCase() === "darwin") {
        video = path.resolve(process.env[home], "Desktop", "Media", "Movies");
    }
```

## Media (Play) API

```
# $ cd $webinos-pzp-path/node_modules
$ git clone https://github.com/webinos/webinos-api-media.git
$ cd webinos-api-media
$ npm install
# In addition you need to install mplayer
$ brew install mplayer 
```

## DeviceStatus API

```
# $ cd $webinos-pzp-path/node_modules
$ git clone https://github.com/webinos/webinos-api-deviceStatus.git
$ cd webinos-api-deviceStatus
$ npm install
```

## App2App API

```
# $ cd $webinos-pzp-path/node_modules
$ git clone https://github.com/webinos/webinos-api-app2app.git
$ cd webinos-api-app2app
$ npm install
```
