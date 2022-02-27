#  SRB2KARTJS 

Javascript module for everything related to the open source game [srb2kart](https://mb.srb2.org/threads/srb2kart.25868/).

## Documentation

* [network](#network)
* [file](#file)
  * [directory](#directory)
* [log file](#log)
* [other, basic stuff](#basics)



All functions are exported in main:

```js
import {getSrb2Info, openFile, logger, parseSocFile} from "srb2kartjs";
```



# Network

##### `getSrb2Info(address, port=5029, servercb, playercb, errorcb)`

* Connects to a srb2kart server using it's ip address + port number and returns the response using the server and player callbacks containing the data as defined by the `serverinfo_pak` and `plrinfo` structs in [`d_clisrv.h`](https://git.do.srb2.org/KartKrew/Kart-Public/-/blob/8cd205cd2807c6a2064935c8b873972c6570e715/src/d_clisrv.h). Same property names are used. Errors on the connection are passed to the error callback.
* `servercb`: callback with server info object.
* `playercb`: callback with player info object.
* `errorcb`: called when errors occur.

# File

##### `openFile(path);`

- Open either a wad or pk3 file using the given path. Returns a Promise containing an object representing the file, or throws an error.
- Returns: Promise\<Srb2kfile>

##### `file.setBaseFile(path);`

- Set the `srb2.pk3` file. This is needed for the palette when extracting images.
- Returns: nothing

##### `file.getDirectory();`

- Get a nested object structure representing the inner file structure.
- Return: object

##### `file.getText(path);`

- Get a string from the file using the full path as given by the directory.
- returns: Promise\<String>

##### `file.getImage(path);`

* Get a graphic from the file using the full path as given by the directory. Needs `setBaseFile` if no custom palette is used.
* Returns: Promise\<Canvas>

##### `file.getSoc(path);`

- Get a soc object from the file using the full path as given by the directory.
- Returns: Promise\<Object>

##### `file.getAllSocs();`

- Get the soc object from every soc text in the file.
- Returns: Promise\<Object>

##### `file.getBuffer(path);`

* Get a nodebuffer from any file in the file using the full path as given by the directory.
* Returns: Promise\<nodebuffer>

## Directory

Object used by the wad and pk3 file objects. This contains the entire directory and supports searching through it. This contains no data and files are represented by empty folders.

##### `directory.fullname;`

* String of the full path starting from root. Use this in file methods.

##### `directory.get(name);`

* Get a child of this directory using the name.
* Returns: Directory object

##### `directory.search(regex);`

* Find all children where the name matches the regex.
* Returns: [Directory object]

# log

##### `logger(filepath="~/.srb2kart/log.txt")`

*  Listens to the srb2kart log file at `filepath` and returns an event emitter eg. `const eventemitter = logger(); eventemitter.on("playerJoin", (o) => console.log(o.name + " has joined the game."))`
* Returns: EventEmitter

##### Log events

```js
"playerJoin"
{
	name,
	ip,
	node
}
```

```js
"playerRename"
{
    oldName,
    newName,
    player: {
        name,
        ip,
        node
    }
}
```

```js
"playerLeave"
{
    name,
    ip,
    node
}
```

```js
"playerSay"
{
    player: {
        name,
		ip,
        node
    },
    message
}
```

```js
"newMap"
{
	mapid,
	mapname
}
```

```js
"command"
{
	command
}
```

```js
"playerFinish"
{
	player: {
		name,
		ip,
		node
	}
}
```

```js
"playerVoteCalled"
{
    player: { // the player calling the vote
        name,
        ip,
		node,
    },
	command
}
```

```js
"playerVote"
{
    player: { // the player voting yes or no
        name,
        ip,
        node,
    },
    choice, // the player's vote, -1 or 1
	vote: {
        callee: {
            name,
            ip,
            node
        },
        command,
        votedYes: [ {player} ], // list of player objects that already have voted yes
        votedNo: [ {player} ], // list of player objects that already have voted no
    }
}
```

```js
"voteComplete"
{
    passed,
	vote: {
        callee: {
            name,
            ip,
            node
        },
        command,
        votedYes: [ {player} ], // list of player objects that already have voted yes
        votedNo: [ {player} ], // list of player objects that already have voted no
    }
}
```

```js
"serverStart"
{}
```

```js
"serverStop"
{}
```

```js
"speedingOffTo"
{}
```

```js
"roundEnd"
{}
```

# Basics

#### pk3

`extractSoc(filepath, socs={})`:  parses the soc files in `filepath` and adds returns the soc `socs` object with the new data.

#### wad

Each function returns a promise.

`getHeader(filename)`: The header of the wad file. 

`getDirectory(filename)`: Get a list of lump information.

`getLumps(filename, lumpname)`: Get a list of lumps matching the filename as buffers.

### soc

`parseSocFile(filename, lines, socs={})`: given the content of a socfile in `lines`, parse the content and add the definitions to the `socs` object which this function returns. `filename` is added to the map metadata.

