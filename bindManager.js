const commands = require('./commands.js');
const database = require('./database.js');
const Discord = require('./discord.js');
const playtimecache = require('./caches/playtimecache.js')
const cacheManager = require('./caches/cachemanager.js')
const totallogincache = require('./caches/totallogincache.js')
const botManager = require('./bot.js');

const cmdhandler = require('./commandhandler.js')

const config = require('./config.json');
const mineflayer = require('mineflayer');
const { EventEmitter } = require('events');
var isConnected = false

startConnectionTestInterval = function() {
	setInterval(()=>{
		if (!isConnected) doConnectionTest(bot);
	}, 3000);
}

exports.bind = (bot) => {
	// connection test loop
	doConnectionTest(bot)
	if(isConnected === false) {
		startConnectionTestInterval()
	}
}

function internalBind(bot) {
	console.log('Binding all the events')
	
	// Kills all intervals running (hopefully)
	var killId = setTimeout(()=>{});
	for (var i = killId; i > 0; i--) clearInterval(i)
	console.log('Killed all the intervals currently alive')
    // Discord chat logging
    bot.on('message', function(jsonMsg) {
		message = String(jsonMsg);
		lastTimeMessage = Date.now();
		username = message.slice(0, message.indexOf(':'));
		text = message.slice(message.indexOf(':') + 2);


		time = new Date();
		console.log('[' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + '] ' + jsonMsg)
	})

    // Command management
	bot.on('chat', function(username, message) {
	    if (username === bot.username) return;

		if (message[0] == config.prefix) {
			if (Date.now() - lastTimeUsed <= config.commandInterval) return;
		  	lastTimeUsed = Date.now();
		  		toSend = cmdhandler.commandHandler(username, message);
		  		if (toSend !== null) {
		  			try{bot.chat(toSend)}catch(e){bot.chat('some error happend. no idea why and how, report this pls')}
		  		}
	    } else {
	  	    cmdhandler.messageHandler(username, message);
	  	}
	});

    // kicked event
	bot.on('kicked', function(reason) {
		Discord.sendMessage(`BOT HAD BEEN KICKED FOR ` + reason.text + ' :crab:');
		cacheManager.dumpCache()
		isConnected = false
		botManager.relog();
	});

	// spam messages
	var spamMessages = ['[Unnamed Bot] Did you know you could do ?fact for a random fact? It\'s epic, I know. Do ?help for more!',
						'[Unnamed Bot] Join Unnamed group\'s discord server to participate in upcoming giveaway (100 members - 3 winners & 3 kits!) ' + config.spammer.discord_link, 
						'[Unnamed Bot] Join Unnamed group\'s discord server to participate in upcoming giveaway (100 members - 3 winners & 3 kits!) ' + config.spammer.discord_link, 
						'[Unnamed Bot] Have troubles with progression on the server? Buy shulkers with THE cheapest prices from the most trustworthy seller! ' + config.spammer.discord_link,
						'[Unnamed Bot] Buy kits from Unnamed group and your dick will grow 3 inches (We have proof and reviews!) ' + config.spammer.discord_link,
						'[Unnamed Bot] btw, you can do /suicide thanks to our only true god - Wising!',
						'[Unnamed Bot] You can do ?playtime, ?quote, ?seen and ?firstmessage! That is pretty cool!',
						'[Unnamed Bot] See any hackers? Do ?report!',
						'[Unnamed Bot] For anyone retarded: this is not an official fucking bot, go buy yourself iq points or some shit',
						'[Unnamed Bot] Just a reminder that Unnamed group is on top!',
						'[Unnamed Bot] Hey Tubbo (or other admin who may see this), please tell tubbo to make a vid or stream here, server is dying'];


	// spammer
	setTimeout(async function() {
		while (true) {
			await botManager.sleep((Math.random() * config.spammer.min_spam_wait * 1000) + config.spammer.random_time_max * 1000).then(async function() {
				randomIndex = Math.floor(Math.random() * spamMessages.length * 2);
				if (randomIndex >= spamMessages.length) {
					// always 50% chance to give a fact
					bot.chat(commands.randomFact())
					return
				}
				bot.chat(spamMessages[randomIndex]);	
			});
		}
	}, 10);


	// login handler
	 setTimeout(async() => {
		setInterval(async function() {
			for(player in bot.players){
				playtimecache.addToCacheValue(player, 1)
			}
		}, 1000)
	}, 1000)
	
	 setTimeout(()=>{
		setInterval(async function() {
			cacheManager.dumpCache()
		}, config.cacheDumpFrequencey*10000);
	}, 25000)

	//player join handler
	bot.on('playerJoined', (player) => {
		database.checkuser(player.username);
		logins = totallogincache.getCacheValue(player)
		if (logins == undefined || logins == 0) {
			//TODO: make a cooldown or something, to make sure it wont die from spamming
			//bot.chat(player.username + ' is new! Welcome to poggop.org!')
			totallogincache.setCacheValue(player.username, 1)
		}
		database.getFirstlogin(player.username, (result)=> {
			if(result === null || result === 0)
				database.setFirstlogin(player.username, Date.now())
		})
		totallogincache.addToCacheValue(player.username, 1)
		database.setLastlogin(player.username, Date.now())
	})

} 

// check if player is acctualy connected to the server
function doConnectionTest(bot) {
	if(bot.player !== undefined) {
		// possible problem: when this dies, it doesn't care about making bot.player a something else, so it will be dead
		// and not revived.
		isConnected = true;
		internalBind(bot)
	} else {
		isConnected = false;
		botManager.relog()		
	}

}
