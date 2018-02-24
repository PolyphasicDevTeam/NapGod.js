const Discord = require("discord.js");
const { URL } = require('url');
const client = new Discord.Client();
const config = require("./config.json");

client.on("ready", () => {
	// This event will run if the bot starts, and logs in, successfully.
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
	client.user.setActivity(config.prefix+'help');
});

client.on("guildCreate", guild => {
	console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
	client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
	client.user.setGame(`on ${client.guilds.size} servers`);
});


client.on("message", async message => {
	//Ignore other bots and messages that do not start with prefix
	if(message.author.bot) return;
	if(message.content.indexOf(config.prefix) !== 0) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if(command === "ping") {
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		const m = await message.channel.send("Ping?");
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
	}

	if(command === "say") {
		const sayMessage = args.join(" ");
		message.delete().catch(O_o=>{}); 
		message.channel.send(sayMessage);
	}

	if(command === "set") {
		if(args.length == 1) {
			if (args[0] === "none") {
				msg = "Nap Chart has been removed for " + message.author.tag + ".";
			}else {
				is_nurl = false
				try {
					const nurl = new URL(args[0])
					if(nurl.host=='napchart.com'){
						imgurl = "https://napchart.com/api/getImage?width=600&height=600&chartid="+nurl.pathname.substring(1)
						console.log(imgurl)
						msg = "Nap Chart set for " + message.author.tag + " to " + nurl.href + ".";
						const msgImg = new Discord.RichEmbed().setDescription(nurl.href).setImage(imgurl).setURL(nurl.href)
						message.channel.send(msg);
						message.channel.send(msgImg);
						//TODO: cache image
						//TODO: save to database
						is_nurl = true
					}
				} catch (err) {}
			}
			if(!is_nurl) {
				schedules = [`e1`,`segmented`,`siesta`,`e2`,`e3`,`e4`,`e5`,`trimaxion`,`bimaxion`,`dc1`,`dc2`,`dc3`,`dc4`,`tc1`,`tc2`,`triphasic`,`sevamayl`,`dymaxion`,`naptation`,`spamayl`,`tesla`,`uberman`,`random`]
				modifiers = [`shortened`,`extended`,`flipped`,`modified`,`recovery`]
				const schedp = args[0].trim().split(/-+/g);
				console.log(schedp)
				console.log(schedules.includes(schedp[0]))
				if (schedp.length <= 2 && schedules.includes(schedp[0]) && (schedp.length == 1 || (schedp.length == 2 && modifiers.includes(schedp[1])))){
					msg = "Schedule set for " + message.author.tag + " to `" + args[0] + "`.";
					message.channel.send(msg);
				} else {
					message.channel.send("`"+args[0] + "` does not appear to be a valid schedule or url.");
				}
			}

			//const sched = message.content.slice(config.prefix.length).trim().split(/ +/g);
			//if(args[0] ==
		}
	}

	if(command === "help") {
		msg = "--- Nap God help ---\
\
Nap God can be used to look up information about common sleep schedules, change your displayed sleep schedule and group, and to save and look up napcharts.\n\
-----------------------------------------------\n\
**Schedule List**\n\
To view information about a sleep schedule, type `+` followed by the schedule name. For example, `+DC1` will display information about DC1.\n\
\n\
Non-polyphasic schedules: Mono\n\
Biphasic schedules: `E1` `Segmented` `Siesta`\n\
Everyman schedules: `E2` `E3` `E4` `E5` `Trimaxion`\n\
Dual core schedules: `Bimaxion` `DC1` `DC2` `DC3` `DC4`\n\
Tri core schedules: `TC1` `TC2` `Triphasic`\n\
Experimental/Unproven schedules: `SEVAMAYL`\n\
Nap only schedules: `Dymaxion` `Naptation` `SPAMAYL` `Tesla` `Uberman`\n\
\n\
Once you have chosen your sleep schedule you can use the `+set` command to tag yourself with it and move yourself to the matching role. You can also use `+set` to set a napchart against your account (created on <https://napchart.com/> or with the `+create` command) which others can then look at. Further details found below.\n\
\n\
If you are new to polyphasic sleeping and are not sure about which sleep schedule to try, feel free to ask for help and advice in the #beginners channel.\n\
-----------------------------------------------"
		message.channel.send(msg);
		msg2 = "**To set your sleep schedule:** Type `+set` followed by a supported schedule name. For example, if you wanted to change your schedule to DC1, you would type `+set DC1`. You may also specify a schedule variant by using a dash separator, e.g. `+set DC1-extended` (supported variants are shortened extended flipped modified and recovery). Experimental unlisted schedules can be set with `+set Experimental`.\n\
**To set your napchart:** Type `+set` followed by the napchart link. For example, `+set https://napchart.com/ro1mi`. To remove your chart instead, use none in place of a link.\n\
**To set both at the same time:** Just specify both. For example, `+set DC1 https://napchart.com/ro1mi`\n\
(Please note that if you change schedules without also setting a napchart, any existing napchart you have will be automatically removed.)\n\
**To look up your own napchart:** Type `+get`.\n\
**To look up someone else's napchart:** Type `+get` followed by the name of the user. Any of the following name formats will work: `+get Username`, `+get Username#0001`, `+get @0001`. Mentions should be avoided though as these will ping the user in question.\n\
**To create a new napchart:** Type `+create` followed by a series of time ranges. For example, `+create 03:00-05:00 08:00-08:20 14:00-14:20 21:00-23:00`. A napchart link will then be generated for you. (If you want to set it, you will have to do that manually afterwards)\n\
**To count number of people on each schedule:** Type `+schedulecount`.\n\
**To list all members sorted by schedule:** Type `+memberlist`.\n\
**To list all members with napcharts set:** Type `+chartlist`.\n\
**To join/leave the watch group for users of NMO:** Type `+togglewatchgroup`.\n\
-----------------------------------------------"
		message.channel.send(msg2);
	}

	if(command === "mhelp") {
		msg = "--- Nap God moderator help ---\n\
\n\
-----------------------------------------------\n\
**To make the Nap God say something:** `+say [message]`\n\
**To set someone's schedule and napchart:** `+mset [schedule-name] [napchart-link] [username]`. Only the standard schedules are supported. Use none in place of the napchart link if you want the user not to have a napchart (any existing chart they have will be removed).\n\
**To set napchart timestamp:** `+msettimestamp [username] [YYYY-MM-DD HH:MM:SS]`\n\
**To rebuild the schedule data for all members:** `+rebuild` (generally you do not want to do this unless data is lost or you have reason to believe data is missing).\n\
-----------------------------------------------"
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

client.login(config.token);
