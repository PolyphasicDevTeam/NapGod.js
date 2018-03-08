const { URL } = require("url");
const _ = require("lodash");
const UserModel = require("./../models/user.model");
const { getOrGenImg, makeNapChartImageUrl, createChart } = require("./../imageCache");


module.exports = {
	processCreate: function(command, message, args,dry=false) {
		if (command === "create") {
			if (args.length >= 1) {
				create(args, message, dry);
			} else {
				msg = "Type `+create` followed by a series of time ranges. For example, `+create 03:00-05:00 08:00-08:20 14:00-14:20 21:00-23:00`. A napchart link will then be generated for you. (If you want to set it, you will have to do that manually afterwards)"
				console.log("MSG   : ", msg)
				if(!dry){message.channel.send(msg);}
			}
			return true
		}
		return false
	}
};

async function create(args, message, dry) {
	console.log("CMD   : CREATE")
	console.log("ARGS  : ", args)
	timeelems = []
	i = 0
	try {
	args.forEach((arg)=>{
		let times = arg.split('-');
		let hm1 = times[0].split(':');
		let hm2 = times[1].split(':');
		s = parseInt(hm1[0])*60 + parseInt(hm1[1])
		e = parseInt(hm2[0])*60 + parseInt(hm2[1])
		timeelems.push({
			start: s, 
			end: e, 
			id: i++,
			lane: 0,
			text: "",
			color: "red"
		})
	})
	} catch (err) {
		console.error("ERR>>>: ", err)
		msg = "Type `+create` followed by a series of time ranges. For example, `+create 03:00-05:00 08:00-08:20 14:00-14:20 21:00-23:00`. A napchart link will then be generated for you. (If you want to set it, you will have to do that manually afterwards)"
		console.log("MSG   : ", msg)
		if(!dry){message.channel.send(msg);}
		return
	}
	let data = {
		data:JSON.stringify({
			chartData:{
				elements: timeelems,
				shape: "circle",
				lanes: 1
			},
			metaInfo:{
				title:"",
				description:""
			}
		})
	}
	//data = JSON.stringify(data)
	console.log("INFO  : ","Napchart payload", data)
	nurl = await createChart(data)
	emb = await getOrGenImg(nurl,message,dry)
	if(!dry){message.channel.send(emb);}
}
