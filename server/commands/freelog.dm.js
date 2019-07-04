const config = require("../../config.json");
const _ = require("lodash");

const freelog = 'freelog';
const logsChannelName = 'adaptation_logs';

module.exports = {
	processFreelog: function(command, message, args, dry=false) {
		if (command === freelog) {
			arg = message.content.slice(config.prefix.length+freelog.length).trim();
			console.log(`CMD   : ${freelog.toUpperCase()}`);
			console.log("ARGS  : ", arg);
			// let roles =  message.member.roles
			// roles = new Set(roles.keys())
			// let mods = message.guild.roles.find("name", "Moderator").id
			// let admins = message.guild.roles.find("name", "Admins").id
			// permissions = false
			// if (roles.has(mods)||roles.has(admins)) {
			// 	permissions = true
			// }
			// if (!permissions) {
			// 	msg = "You do not have privileges to execute this commands. Only Moderators and Admins are allowed to use `+say`"
			// 	console.log("MSG   : ", msg)
			// 	if(!dry){message.channel.send(msg);}
			// }
			// else {
				console.log("MSG   : ", `Printing user input to #${logsChannelName}`);
				const member = getMember(message);
				if (!dry) {
					if (member) {
						// getChannel(message, logsChannelName).send(`Name: @${member.displayName}\n` + arg);
						getChannel(message, logsChannelName).send(`Name: <@${message.author.id}>\n` + arg);
					} else {
						message.author.send('You must join the Polyphasic Sleeping server if you want to post adaptation logs.');
					}
				}
			// }
			return true
		}
		return false
	}
};

function getMember(message) {
	const guild = getGuild(message);
	const userId = message.author.id;
	return guild.members.find(member => member.user.id === userId + 'lol');
}

function getChannel(message, channelName) {
	const guild = getGuild(message);
	return guild.channels.find(channel => channel.name === channelName);
}

function getGuild(message) {
	return message.client.guilds.first();
}
