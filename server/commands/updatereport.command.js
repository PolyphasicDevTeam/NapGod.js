const config = require("../../config.json");
const UserModel = require("./../models/user.model");
const ReportModel = require("./../models/report.model");
const { getOrGenImg, makeNapChartImageUrl } = require("./../imageCache");
const { URL } = require("url");
const fs = require('fs');
const _ = require("lodash");

module.exports = {
  processTogglewatchgroup: function(command, message, args, dry=false) {
    if (command === "generatereport" || command === "createreport" || command === "report") {
      console.log("CMD   : REPORT");
      console.log("ARGS  : ", args);

      report(args,message, dry);

      return true;
    }
    return false;
  }
};

function toMinute(d) {
  return d/1000/60;
}


async function report(args, message, dry) {
  let report = await ReportModel.findOne();
  let msg = '';
  if ((report !== null) && (toMinute(new Date() - new  Date(report.updatedAt))
			    < (config.reportInterval || 5) )) { // default value 5 mins
    msg += "The last report is too recent, it is available at <https://cache.polyphasic.net/report.json> and <https://cache.polyphasic.net/report.html>.";
  } else if ((report !== null) && (new Date(report.updatedAt) > new Date(report.lastSetAt))){
    msg += "The last report was up to date, and is available at <https://cache.polyphasic.net/report.json> and <https://cache.polyphasic.net/report.html>.";
  } else {
    msg += 'Generating the report!';
    let users = await UserModel.find({});
    generateHTML(message, users, dry);
    generateJSON(message, users, dry);
    ReportModel.create({'lastSetAt': (report !== null) ? report.lastSetAt : Date.now()})
      .then(console.log)
      .catch(console.error);
  }
  console.log("MSG   : ", msg);
  if(!dry){ message.channel.send(msg); }
}

function generateJSON(message, users, dry=false){
  let a = fs.writeFile("/napcharts/report.json",
		       JSON.stringify(users),
		       err=> {
			 let msg = '';
			 if (err) {
			   msg += err;
			   console.log("ERR>>>: ", err);
			 } else {
			   msg += "Report has been updated and is available at <https://cache.polyphasic.net/report.json>.";
			   console.log("MSG   : ", msg);
			 }
			 if(!dry){ message.channel.send(msg); }
		       });
  return a;
}




function generateHTML(message, users, dry) {
  try {
    let body = "";
    users.forEach(function(user) {
      try {
	uid = user.id;
	console.log("INFO  : ", "Processing:", uid);
	member = message.guild.member(uid);
	//Name of the user
	if (member != null) {
	  if(member.nickname != null) {
	    name = `<h3>${member.nickname}</h3>`;
	  } else {
	    name = `<h3>${member.user.tag}</h3>`;
	  }
	} else {
	  name = `<h3>${user.tag} (last known tag, uid:${uid})</h3>`;
	}

	//Current schedule
	sched = `Current schedule: ${user.currentScheduleName}<br/>`;

	//Current napchart
	napchart = "";
	napchartimg = "";
	if (user.currentScheduleChart == null) {
	  napchart = "No napchart is currently set<br/>";
	} else {
	  napchart = `Current napchart: <a href="${user.currentScheduleChart}">${user.currentScheduleChart}</a><br/>`;
	  let { napChartId, imgurl } = makeNapChartImageUrl(new URL(user.currentScheduleChart));
	  napchartimg = `<p><a href="${user.currentScheduleChart}"><img src="${imgurl}" /></a></p>`;
	}

	//Schedule history
	sched_hist = "";
	user.historicSchedules.forEach(function(sch) {
	  d = new Date(sch.setAt);
	  n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
	  sched_hist += `${n}: ${sch.name}<br/>\n`;
	});

	//Chart history
	chrt_hist = "";
	user.historicScheduleCharts.forEach(function(ch) {
	  d = new Date(ch.setAt);
	  n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
	  chrt_hist += `${n}: <a href="${ch.url}">${ch.url}</a><br/>\n`;
	});
	body += `${name}\n${sched}\n${napchart}\n${napchartimg}\n<table>\n<tr>\n<td>Schedule history:</td>\n<td>Napchart history</td>\n</tr>\n<tr>\n<td valign="top">${sched_hist}</td>\n<td valign="top">${chrt_hist}</td>\n</tr>\n</table><br/>`;
      } catch (err) { 
	console.log("ERR>>>: ", err);
      }

    });


    d = new Date();
    n = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let html = `<!DOCTYPE html>\n\
<html lang="en">\n\
  <head>\n\
	 <meta charset="utf-8">\n\
	 <title>Nap God Report ${n}</title>\n\
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-110338868-3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-110338868-3');
</script>
  </head>\n\
  <body>\n\
	<h1>Nap God Report ${n}</h1>\n\
	 ${body}\n\
  </body>\n\
</html>`;
    return fs.writeFile('/napcharts/report.html', html, err=> {
      let msg = '';
      if (err) {
	msg += err;
	console.log("ERR>>>: ", err);
      } else {
	msg += "Report has been updated and is available at <https://cache.polyphasic.net/report.html>.";
	console.log("MSG   : ", msg);
      }
      if(!dry){ message.channel.send(msg); }
    });
  } catch (err) { 
    console.log("ERR>>>: ", err);
    return 'Error while generating the HTML report';
  }
}
