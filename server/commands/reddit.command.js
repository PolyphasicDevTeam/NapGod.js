const config = require("../../config.json");
const _ = require("lodash");
const request = require('request')
const Discord = require("discord.js");


module.exports = {
    processAdapted: function(command, message, args, dry=false) {
	if (command === "reddit") {
	    console.log("CMD   : REDDIT")
	    console.log("ARGS  : ", args)
	    get_reddit2(args, message, dry);
	    return true
	}
	return false
    }
};




async function get_reddit(args, message, dry){
    load("https://www.reddit.com/r/polyphasic/new.json?limit=1", dry, message);
}


async function load(url, dry, message) {
    request.get(url, { json: true }, (err, res, body) => {
	if (err) { return console.log(err); }
	if ((!dry) && (res.statusCode == 200)){
	    (body, message);
	}
    });
}


function send_embed_post(json, message){
    console.log(json);
    data = json.data.children[0].data;
    console.log(data);
    author = data.author;
    id = data.id;
    link = data.url;
    text = data.selftext;
    sub = data.subreddit_name_prefixed;
    title = data.title;
    if (data.thumbnail == "self"){
	thumbnail = "https://upload.wikimedia.org/wikipedia/fr/f/fc/Reddit-alien.png"
    } else {
	thumbnail = data.thumbnail;
    }
    console.log( {
	embed: {
	    color: 3447003,
	    author: {
		name: author,
		icon_url: thumbnail
	    },
	    title: title,
	    url: link,
	    description: id,
	    fields: [
		{
		    name: "Text Short",
		    value: text.substring(0,250)+"..."
		}
	    ],
	    timestamp: new Date(),
	    footer: {
		text: "From: "+sub
	    }
	}
    })
    message.channel.send(
	{
	    embed: {
		color: 3447003,
		author: {
		    name: author,
		    icon_url: thumbnail
		},
		title: title,
		url: link,
		description: id,
		fields: [
		    {
			name: "Text Short",
			value: text.substring(0,250)
		    }
		],
		timestamp: new Date(),
		footer: {
		    text: "From: "+sub
		}
	    }
	});
    
}

function send_rich_embed_post(json, message){
    console.log(json);
    data = json.data.children[0].data;
    console.log(data);
    author = data.author;
    id = data.id;
    link = "https://reddit.com"+data.permalink;
    urlPossible = data.url;
    text = data.selftext;
    sub = data.subreddit_name_prefixed;
    title = data.title;
    date = new Date(data.created * 1000).toISOString();
    nb_sub = data.subreddit_subscribers;
    if (data.thumbnail == "self"){
	thumbnail = "https://upload.wikimedia.org/wikipedia/fr/f/fc/Reddit-alien.png"
    } else {
	thumbnail = data.thumbnail;
    }
    const embed = new Discord.RichEmbed()
	  .setTitle(title)
	  .setAuthor(author, "https://upload.wikimedia.org/wikipedia/fr/f/fc/Reddit-alien.png")
    /*
     * Alternatively, use "#00AE86", [0, 174, 134] or an integer number.
     */
	  .setColor(0xFF0000)
	  .setDescription(id)
	  .setFooter("From:"+sub+" | "+nb_sub+" subs", "https://styles.redditmedia.com/t5_2qlwv/styles/communityIcon_yr715i5y6hc11.png")
	  .setImage(thumbnail)
	  .setThumbnail('https://styles.redditmedia.com/t5_2qlwv/styles/communityIcon_yr715i5y6hc11.png')
    /*
     * Takes a Date object, defaults to current date.
     */
	  .setTimestamp(date)
	  .setURL(link)
	  .addField("Text",
     		    text.substring(0,250)+"...")
    // /*
    //  * Inline fields may not display as inline if the thumbnail and/or image is too big.
    //  */
    // 	  .addField("Inline Field", "They can also be inline.", true)
    /*
     * Blank field, useful to create some space.
     */
	  // .addBlankField(true)
	  // .addField("Inline Field 3", "You can have a maximum of 25 fields.", true);
    console.log(embed);
    message.channel.send({embed});
}


