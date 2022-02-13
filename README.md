#  SRB2KARTJS 

Javascript module for everything related to the open source game [srb2kart](https://mb.srb2.org/threads/srb2kart.25868/).



## documentation

`getSrb2Info(address, port=5029, servercb, playercb, errorcb)`: connects to a srb2kart server using it's ip address + port number and returns the response using the server and player callbacks containing the data as defined by the `serverinfo_pak` and `plrinfo` structs in [`d_clisrv.h`](https://git.do.srb2.org/KartKrew/Kart-Public/-/blob/8cd205cd2807c6a2064935c8b873972c6570e715/src/d_clisrv.h). Errors on the connection are passed to the error callback.

`logger(filepath="~/.srb2kart/log.txt")`: Listens to the srb2kart log file at `filepath` and returns an event emitter, see [log events](#logevents). eg. `const logemitter = logger(); logemitter.on("playerJoin", (o) => console.log(o.name + " has joined the game."))`

`extractSocG(filepath, socs={})`:  parses the soc files in `filepath` and adds returns the soc `socs` object with the new data.

`parseSocFile(filename, lines, socs={})`: given the content of a socfile in `lines`, parse the content and add the definitions to the `socs` object which this function returns. `filename` is added to the map metadata.



# logevents

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

