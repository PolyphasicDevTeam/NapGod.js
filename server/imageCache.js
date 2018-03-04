const ImgModel = require("./models/img.model");
const imgur = require("imgur");
const Discord = require("discord.js");
const { URL } = require("url");
const axios = require('axios');

module.exports = {
  getOrGenImg: function(nurl, message) {
    if(!nurl.pathname){
        nurl = new URL(nurl);
    }
    let { napChartId, imgurl } = makeNapChartImageUrl(nurl);

    ImgModel.findOne({ napchartid: napChartId })
      .then(async res => {
        console.log("img search res", res);
        let msgImg = null;
        if (!res) {
          let json = await imgur.uploadUrl(imgurl);

          console.log(json.data.link);
          msgImg = new Discord.RichEmbed()
            .setDescription(nurl.href)
            .setImage(json.data.link)
            .setURL(nurl.href);

          let newImg = new ImgModel({
            napchartid: napChartId,
            url: json.data.link
          }).save();
        } else {
          msgImg = new Discord.RichEmbed()
            .setDescription(nurl.href)
            .setImage(res.url)
            .setURL(nurl.href);
        }
        message.channel.send(msgImg);
      })
      .catch(err => {
        console.log("error searching for img: ", err);
      });
  },
  makeNapChartImageUrl: makeNapChartImageUrl,
  createChart: function(data){
    let url = "https://napchart.com/api/create";
    axios.post(url, data).then((res)=>{
      console.log("chart created")
    })
  }
};

function makeNapChartImageUrl(nurl) {
    let napChartId = nurl.pathname.substring(1);
    let imgurl = "https://napchart.com/api/getImage?width=600&height=600&chartid=" +
        napChartId;
    return { napChartId, imgurl };
}

