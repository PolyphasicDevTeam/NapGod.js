
module.exports = {
  processDevCommands: async function(command, message, args) {
    if (command === "ping") {
      // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
      // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
      const m = await message.channel.send("Ping?");
      m.edit(
        `Pong! Latency is ${m.createdTimestamp -
          message.createdTimestamp}ms. API Latency is ${Math.round(
          client.ping
        )}ms`
      );
    }

    if (command === "say") {
      const sayMessage = args.join(" ");
      message.delete().catch(O_o => {});
      message.channel.send(sayMessage);
    }

    if (command === "set") {
      if (args.length == 1) {
        if (args[0] === "none") {
          msg = "Nap Chart has been removed for " + message.author.tag + ".";
        } else {
          is_nurl = false;
          try {
            const nurl = new URL(args[0]);
            if (nurl.host == "napchart.com") {
              imgurl =
                "https://napchart.com/api/getImage?width=600&height=600&chartid=" +
                nurl.pathname.substring(1);
              console.log(imgurl);
              msg =
                "Nap Chart set for " +
                message.author.tag +
                " to " +
                nurl.href +
                ".";
              const msgImg = new Discord.RichEmbed()
                .setDescription(nurl.href)
                .setImage(imgurl)
                .setURL(nurl.href);
              message.channel.send(msg);
              message.channel.send(msgImg);
              //TODO: cache image
              //TODO: save to database
              is_nurl = true;
            }
          } catch (err) {}
        }
        if (!is_nurl) {
          schedules = [
            `e1`,
            `segmented`,
            `siesta`,
            `e2`,
            `e3`,
            `e4`,
            `e5`,
            `trimaxion`,
            `bimaxion`,
            `dc1`,
            `dc2`,
            `dc3`,
            `dc4`,
            `tc1`,
            `tc2`,
            `triphasic`,
            `sevamayl`,
            `dymaxion`,
            `naptation`,
            `spamayl`,
            `tesla`,
            `uberman`,
            `random`
          ];
          modifiers = [
            `shortened`,
            `extended`,
            `flipped`,
            `modified`,
            `recovery`
          ];
          const schedp = args[0].trim().split(/-+/g);
          console.log(schedp);
          console.log(schedules.includes(schedp[0]));
          if (
            schedp.length <= 2 &&
            schedules.includes(schedp[0]) &&
            (schedp.length == 1 ||
              (schedp.length == 2 && modifiers.includes(schedp[1])))
          ) {
            msg =
              "Schedule set for " +
              message.author.tag +
              " to `" +
              args[0] +
              "`.";
            message.channel.send(msg);
          } else {
            message.channel.send(
              "`" + args[0] + "` does not appear to be a valid schedule or url."
            );
          }
        }

        //const sched = message.content.slice(config.prefix.length).trim().split(/ +/g);
        //if(args[0] ==
      }
    }
  }
};
