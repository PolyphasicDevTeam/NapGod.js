const ImgModel = require("./models/img.model");
const imgur = require("imgur");
const Discord = require("discord.js");
const request = require('request')
const fs = require('fs');
const { URL } = require("url");
const axios = require('axios');

module.exports = {
	getOrGenImg: function(nurl, message, dry=false) {
		if(!nurl.pathname){
			nurl = new URL(nurl);
		}
		let { napChartId, imgurl } = makeNapChartImageUrl(nurl);

		ImgModel.findOne({ napchartid: napChartId })
			.then(res => {
				if(res==null){console.log("INFO  : ","Image search res", res);}
				else{console.log("INFO  : ","Image search res", res.url);}
				let msgImg = null;
				if (!res) {
					//let json = await imgur.uploadUrl(imgurl);
					//console.log("INFO  : ",json.data.link)
					console.log("INFO  : ", 'Downloading napchart: '+napChartId)
					request.get({url: imgurl, encoding: 'binary'},(err,res)=>{
						fs.writeFile('/napcharts/'+napChartId+".png", res.body, 'binary', err=> {
							cacheurl = "http://cache.polyphasic.net/"+napChartId+".png"

							console.log("MSG   : ", 'RichEmbed['+nurl.href+']')
							if(!dry){
								msgImg = new Discord.RichEmbed()
									.setDescription(nurl.href)
									.setImage(cacheurl)
									.setURL(nurl.href);
								message.channel.send(msgImg);
							}

							let newImg = new ImgModel({
								napchartid: napChartId,
								url: cacheurl
							}).save();

						})
					})
				} else {
					console.log("MSG   : ", 'RichEmbed['+nurl.href+']')
					if(!dry){
						msgImg = new Discord.RichEmbed()
							.setDescription(nurl.href)
							.setImage(res.url)
							.setURL(nurl.href);
						message.channel.send(msgImg);
					}
				}
			})
			.catch(err => {
				console.warn("WARN>>: ", "Could not get napchart from db: ", err);
			});
	},
	makeNapChartImageUrl: makeNapChartImageUrl,
	createChart: function(data){
		let url = "https://napchart.com/api/create";
		return new Promise(function (resolve, reject) {
			axios.post(url, data).then((res)=>{
				console.log("INFO  : ","Chart created", res.data.id)
				let nurl = "https://napchart.com/"+res.data.id
				resolve(nurl)
			}).catch((error)=>{
				console.error("ERR   : ","Chart could not be created", error)
				reject(error)
			})
		})
	}
};

function makeNapChartImageUrl(nurl) {
	let napChartId = nurl.pathname.substring(1);
	let imgurl = "https://napchart.com/api/getImage?width=600&height=600&chartid=" +
		napChartId;
	return { napChartId, imgurl };
}

