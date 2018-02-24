const Discord = require("discord.js");
const { URL } = require('url');
const client = new Discord.Client();
const config = require("./config.json");
const fs = require('fs');

let commands = {};
fs.readdir("./commands", (e, r) => {
	r.forEach(function (d) {
		if (!d.endsWith('.md')) return;

		let commandName = d.replace(".md", "").toLowerCase();
		if (commandName.indexOf('.') >= 0) {
			commandName = commandName.split('.')[0];
			if (!commands.hasOwnProperty(commandName)) {
				commands[commandName] = [];
			}
			commands[commandName].push(fs.readFileSync("./commands/" + d, 'utf8'))
		} else {
			commands[commandName] = fs.readFileSync("./commands/" + d, 'utf8')
		}
	})
})

client.on("ready", () => {
	// This event will run if the bot starts, and logs in, successfully.
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
	client.user.setActivity(config.prefix + 'help');
});

client.on("guildCreate", guild => {
	console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
	client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
	client.user.setGame(`on ${client.guilds.size} servers`);
});


client.on("message", (message) => {
	//Ignore other bots and messages that do not start with prefix
	if (message.author.bot) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if (message.content.indexOf(config.devPrefix) === 0) {
		processDevCommands(command, message, args);
	} else if (message.content.indexOf(config.prefix) === 0) {
		if (commands.hasOwnProperty(command)) {
			let mVal = commands[command];
			if(Array.isArray(mVal)){
				mVal.forEach(m => message.channel.send(m))
			} else {
				message.channel.send(mVal)
			}
		}
	}
	/*
	if(command === "kick") {
	// This command must be limited to mods and admins. In this example we just hardcode the role names.
	// Please read on Array.some() to understand this bit: 
	// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
		if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
			return message.reply("Sorry, you don't have permissions to use this!");

// Let's first check if we have a member and if we can kick them!
// message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
		let member = message.mentions.members.first();
		if(!member)
			return message.reply("Please mention a valid member of this server");
		if(!member.kickable) 
			return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");

// slice(1) removes the first part, which here should be the user mention!
		let reason = args.slice(1).join(' ');
		if(!reason)
			return message.reply("Please indicate a reason for the kick!");

// Now, time for a swift kick in the nuts!
		await member.kick(reason)
			.catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
		message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

	}

	if(command === "ban") {
	// Most of this command is identical to kick, except that here we'll only let admins do it.
	// In the real world mods could ban too, but this is just an example, right? ;)
		if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
			return message.reply("Sorry, you don't have permissions to use this!");

		let member = message.mentions.members.first();
		if(!member)
			return message.reply("Please mention a valid member of this server");
		if(!member.bannable) 
			return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

		let reason = args.slice(1).join(' ');
		if(!reason)
			return message.reply("Please indicate a reason for the ban!");

		await member.ban(reason)
			.catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
		message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
	}

	if(command === "purge") {
		const deleteCount = parseInt(args[0], 10);
		if(!deleteCount || deleteCount < 2 || deleteCount > 100)
			return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

// So we get our messages, and delete them. Simple enough, right?
		const fetched = await message.channel.fetchMessages({count: deleteCount});
		message.channel.bulkDelete(fetched)
			.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
	}*/
});

async function processDevCommands(command, message, args) {

	if (command === "ping") {
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		const m = await message.channel.send("Ping?");
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
	}

	if (command === "say") {
		const sayMessage = args.join(" ");
		message.delete().catch(O_o => { });
		message.channel.send(sayMessage);
	}

	if (command === "set") {
		if (args.length == 1) {
			if (args[0] === "none") {
				msg = "Nap Chart has been removed for " + message.author.tag + ".";
			} else {
				is_nurl = false
				try {
					const nurl = new URL(args[0])
					if (nurl.host == 'napchart.com') {
						imgurl = "https://napchart.com/api/getImage?width=600&height=600&chartid=" + nurl.pathname.substring(1)
						console.log(imgurl)
						msg = "Nap Chart set for " + message.author.tag + " to " + nurl.href + ".";
						const msgImg = new Discord.RichEmbed().setDescription(nurl.href).setImage(imgurl).setURL(nurl.href)
						message.channel.send(msg);
						message.channel.send(msgImg);
						//TODO: cache image
						//TODO: save to database
						is_nurl = true
					}
				} catch (err) { }
			}
			if (!is_nurl) {
				schedules = [`e1`, `segmented`, `siesta`, `e2`, `e3`, `e4`, `e5`, `trimaxion`, `bimaxion`, `dc1`, `dc2`, `dc3`, `dc4`, `tc1`, `tc2`, `triphasic`, `sevamayl`, `dymaxion`, `naptation`, `spamayl`, `tesla`, `uberman`, `random`]
				modifiers = [`shortened`, `extended`, `flipped`, `modified`, `recovery`]
				const schedp = args[0].trim().split(/-+/g);
				console.log(schedp)
				console.log(schedules.includes(schedp[0]))
				if (schedp.length <= 2 && schedules.includes(schedp[0]) && (schedp.length == 1 || (schedp.length == 2 && modifiers.includes(schedp[1])))) {
					msg = "Schedule set for " + message.author.tag + " to `" + args[0] + "`.";
					message.channel.send(msg);
				} else {
					message.channel.send("`" + args[0] + "` does not appear to be a valid schedule or url.");
				}
			}

			//const sched = message.content.slice(config.prefix.length).trim().split(/ +/g);
			//if(args[0] ==
		}
	}
}

client.login(config.token);
