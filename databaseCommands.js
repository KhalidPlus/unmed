const mineflayer = require('mineflayer');
const Discord = require('discord.js');
const bot = require('./bot.js');
const database = require('./database.js');
const textlogcache = require('./caches/textlogcache.js')
const playtimecache = require('./caches/playtimecache.js')
const cacheManager = require('./caches/cachemanager.js')
const totallogincache = require('./caches/totallogincache.js')

cachedPlayers = []

String.prototype.replaceAll = function(str1, str2, ignore) {
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}



function timeToTextAgo(time) {
	text = ""
	days = Math.floor(time / 86400)
	time %= 86400;
	hours = Math.floor(time / 3600);
	time %= 3600;
	minutes = Math.floor(time / 60);
	seconds = time % 60;
	if(days > 0){ 
	  text += days + ' day'
	  days > 1 ? text+='s ':text+=' '
	  }
	if(hours > 0){ 
	text += hours + ' hour'
	hours > 1 ? text+='s ':text+=' '
	}
	if(minutes > 0){ 
	  text += minutes + ' minute'
	  minutes > 1 ? text+='s ':text+=' '
	}
	return text
}

exports.playtime = function(username, args) {
	return new Promise((later) => {
		if (args.length >= 1) username = args[0];

		time = playtimecache.getCacheValue(username)
		if (time == 0) {
			later('I have never seen ' + username + ' before!')
			return
		}
		text = ''
		text += username + "'s playtime is "
		days = Math.floor(time / 86400)
		time %= 86400;
		hours = Math.floor(time / 3600);
		time %= 3600;
		minutes = Math.floor(time / 60);
		seconds = time % 60;
		if(days > 0){ 
		  text += days + ' day'
		  days > 1 ? text+='s ':text+=' '
		  }
		if(hours > 0){ 
		text += hours + ' hour'
		hours > 1 ? text+='s ':text+=' '
		}
		if(minutes > 0){ 
		  text += minutes + ' minute'
		  minutes > 1 ? text+='s ':text+=' '
		}
		later(text)

	})

}

exports.firstmessage = function(username, args) {
	return new Promise((later)=>{
		if (args.length >= 1) username = args[0];
		database.getFirstmessage(username, (message)=>{
			if (message == '') {
				later(username + ' haven\'t said anything yet!')
				return
			}
			later('"' + message + '" -' + username)				
		})
	})
}

exports.lastSeen = function(username, args) {
	return new Promise((later)=>{
		if (args.length >= 1) {
			username = args[0]
		} else {
			later('Please, do ?seen <username>.')
			return;
		}

		database.getLastlogin(username, (time)=>{
			if (time == 0) {
				later('I have never seen ' + username + '!')
				return
			}
			//console.log)
			if (Object.keys(bot.bot.players).includes(username)) {
				later(username + ' is online right now!')
				return;	
			}
			later(username + ' was last online ' + timeToTextAgo(Math.floor((Date.now() - time)/1000)) + ' ago.')
		})
	})
}

exports.firstlogin = function(username, args) {
	return new Promise((later)=>{
		if (args.length >= 1) username = args[0]

		database.getFirstlogin(username, (time)=>{
			console.log(time)
			if (time === 0 ||time === null) {
				later('I have never seen ' + username + '!')
				return
			}
			later(username + ' joined the server first ' + timeToTextAgo(Math.floor((Date.now() - time)/1000)) + ' ago.')
		})
	})
}

exports.quote = function(username, args) {
	return new Promise((later)=>{
		if (args.length >= 1) username = args[0];
		console.log(username)
		database.getRandomTextmessage(username, (message)=>{
			if (message === null) {
				later(username + ' hasn\'t said anything yet!')
				return
			}
			later('"' + message + '" -' + username)
		})

	})
}

exports.bindDatabaseShit = function(bot) {
	bot.on('login', async() => {

		// since im not sure if all players and functions do check user, make sure
		// that everyone is checked

		setInterval(async function() {
			for(player in bot.players){
				playtimecache.addToCacheValue(player, 1)
			}
		}, 1000);

		setTimeout(()=>{
			// not sure if it will load everything in the cache the moment it will get loaded, so 
			// to not rewrite whole db with semi loaded cache add 25 second delay

			setInterval(async function() {
				cacheManager.dumpCache()
			}, 600000); // once an hour
		}, 25000)

 	});

	bot.on('playerJoined', (player) => {
		database.checkuser(player.username);
		logins = totallogincache.getCacheValue(player)
		if (logins == 0) {
			bot.chat(player.username + ' is new! Welcome to poggop.org!')
			playtimecache.setCacheValue(player.username, 60)
			database.setFirstlogin(Date.now())
			// setting 1 minute of playtime when someone joins because 
			// minumum displayable playtime is 1 minute
		}
		totallogincache.addToCacheValue(player.username, 1)
		database.setLastlogin(player.username, Date.now())
	
	})

}

//database.init('localhost', 'root', '79397939', 'textlog', 'minedata')
//textlogcache.init()
//textlogcache.addToCacheValue("Nowilltolife", "e", Date.now())

//this.quote("Nowilltolife",  ["Nowilltolife"]).then((result)=>{console.log(result)})

