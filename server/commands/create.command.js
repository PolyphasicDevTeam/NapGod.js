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
	msg = "Type `+create` followed by a series of time ranges. For example, `+create 03:00-05:00 08:00-08:20 14:00-14:20 21:00-23:00`. A napchart link will then be generated for you. (If you want to set it, you will have to do that manually afterwards)";
	console.log("MSG   : ", msg);
	if(!dry){message.channel.send(msg);}
      }
      return true;
    }
    return false;
  }
};

async function create(args, message, dry) {
  console.log("CMD   : CREATE");
  console.log("ARGS  : ", args);
  timeelems = [];
  i = 0;
  try {
    args.forEach((arg)=>{
      let times = arg.split('-');
      s = parseTime(times[0]);
      e = parseTime(times[1]);
      if (s > 1440 || e > 1440){
        message.channel.send("You're dumb.");
        throw new Error();
      }

      timeelems.push({
	start: s,
	end: e,
	id: i++,
	lane: 0,
	text: "",
	color: "red"
      });
    });
  } catch (err) {
    console.error("ERR>>>: ", err);
    msg = "Type `+create` followed by a series of time ranges. For example, `+create 03:00-05:00 08:00-08:20 14:00-14:20 21:00-23:00`. A napchart link will then be generated for you. (If you want to set it, you will have to do that manually afterwards)";
    console.log("MSG   : ", msg);
    if(!dry){message.channel.send(msg);}
    return;
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
  };
  //data = JSON.stringify(data)
  console.log("INFO  : ","Napchart payload", data);
  nurl = await createChart(data);
  emb = await getOrGenImg(nurl,message,dry);
  if(!dry){message.channel.send(emb);}
}
function parseTime(s) {
  let hours;
  let hm = null;

  if (s.includes(":")){
    hm = s.split(":");
  }
  else if (s.length == 4){
    hm = [s.slice(0,2), s.slice(2,4)];
  }
  else if (s.length == 3){
    hm = [s.slice(0,1), s.slice(1,3)];
  }

  if (hm){
    hours = parseInt(hm[0]);
    hours += parseInt(hm[1]) / 60;
  }
  else{
    hours = parseInt(s);
  }
  return 60 * hours;
}
