const config = require("../../config.json");
const FocusModel = require("./../models/focus.model");

const days = ["Monday", "Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];



module.exports = {
  procesFocus: function(command, message, args, dry=false){
    if (command === "unfocus"){
      console.log("CMD   : UNFOCUS");
      console.log("ARGS  : ", args);
      let roles =  message.member.roles;
      roles = new Set(roles.keys());
      let mods = message.guild.roles.find("name", "Moderator").id;
      let admins = message.guild.roles.find("name", "Admins").id;
      if (args.length == 1){ // one argument = mod only command, for unfocusing someone
	if (roles.has(mods) || roles.has(admins)){
	  unfocus_admin(message, args, dry);
	} else {
	  msg = "You do not have the privileges to execute this command. Only Moderator or Admins are allowed to unfocus someone";
	  console.log("MSG  :", msg);
	  if(!dry){message.channel.send(msg);}
	}
      } else if (args.length == 0){
	self_unfocus(message, args, dry);
      } else {
	msg = "Valid options are `+unfocus`";
	if (roles.has(mods) || roles.has(admins)){
	  msg += " or `+unfocus [username]`";
	}
	console.log("MSG   : ", msg);
	if(!dry){message.channel.send(msg);}
      }
      return true;
    }
    return false;
  }
};

function expire_time(user){
  let result = FocusModel.findOne({id: user.id});
  return result;
}

function formatDate(date){
  return ('{date} {0} {1} {3} {4}:{5}:{6} UTC').replace('{date}', days[date.getDay()]).replace('{0}', date.getDate()).replace('{1}', months[date.getMonth()]).replace('{3}', date.getFullYear()).replace('{4}', date.getHours()).replace('{5}', date.getMinutes().toString().length == 1 ? '0'+date.getMinutes() : date.getMinutes()).replace('{6}', date.getSeconds().toString().length == 1 ? '0'+date.getSeconds() : date.getSeconds());
}

function h_n_m(minutes){
  minutes = Math.trunc(minutes);
  heures = Math.trunc(minutes / 60);
  minutes = minutes % 60;
  return heures + 'h ' + minutes + "m";  
}

async function self_unfocus(message, args, dry){
  let msg = "";
  let member = message.member;
  let time = await expire_time(member);
  if (time == null){
    msg = "You're not focus in the first place!";
    console.log("MSG: ", msg);
    if(!dry){message.channel.send(msg);};
  } else if (time.endDate > new Date()){
    msg = "You can't be unfocused yet! Focus end at " + formatDate(time.endDate) + ' (' + h_n_m((time.endDate - new Date())/60000) + ')';
    console.log("MSG: ", msg);
    if(!dry){message.channel.send(msg);};
  } else {
    unfocus(member, message, dry);
  }
}

async function unfocus_admin(message, args, dry){
  let msg = "";
  let member = await find_member(message, args, dry);
  if (member != null){
    unfocus(member, message, dry);
  }
}


function unsetRole(user, name_role, message, dry){
  let role = message.guild.roles.find("name", name_role.trim());
  let roles = user.roles;
  roles = new Set(roles.keys());
  roles.delete(role.id);
  if(!dry){user.setRoles(Array.from(roles));}
}

async function unfocus(user, message, dry){
  let query = {id: user.id};
  try {
    let result = await FocusModel.findOneAndRemove(query);
    if (result != null){
      unsetRole(user, "Focus", message, dry);
      msg = user.user.tag + " isn't focus anymore!";
      console.log("MSG: ", msg);
      if(!dry){message.channel.send(msg);};
      if(!dry && (message.channel.name != "botspam_shitpost")){message.client.channels.find('name', "botspam_shitpost").send(msg);}	    
    } else {
      msg = user.user.tag + " isn't focus in the first place!";
      console.log("MSG: ", msg);
      if(!dry){message.channel.send(msg);};
    }
  } catch(error) {
    console.log("error updating in unfocus", error);
    if(!dry){message.channel.send("We have a problem here. Contact the admin team. ");};
  }
}





async function find_member(message, args, dry){
  //We need to extract the username which can containe arbitrary whitespaces
  //First use a function who extract it, depending of the command, from the args or the message itself
  let user = get_username(args, message, dry);
  let member = await find_uid(user, message, dry);
  if (member == null){
    member = await find_nick(user, message, dry);
  }
  return member;
}

// this function change depending of the command, because it's never the same length of command, or position for arguments
function get_username(args, message, dry){
  let msg = "";
  //We need to extract the username which can containe arbitrary whitespaces
  //First get rid of the prefix and 'unfocus' command string (6chars long) and trim
  message.content = message.content.slice(config.prefix.length+8,message.content.length).trim();
  let split_msg = message.content.split(' ');
  let user = split_msg.pop();
  user = user.trim();
  return user;
}


async function find_uid(user, message, dry){
  let uid = user.replace(/[<@!>]/g, '');
  if (uid != '') {//Try to get user by id
    console.log("INFO  : ", "User mentioned by UID", uid);
    let member = null;
    try {
      member = await message.guild.fetchMember(uid);
    } catch (err) {
      console.warn("WARN  : ", "User could not be fetched by UID", uid);
    }
    if (member != null) { //We found a valid user
      console.log("INFO  : ", "User was found by UID", member.user.tag);
      return member;
    }
  }
  return null;
}


async function fetch_Members(message){
  let res = await message.guild.fetchMembers();
  ms = res.members;
  ms = ms.array();
  return ms;
}

function is_user_found(array, message, user, dry){
  if (array.length > 0){
    if (array.length == 1){
      return array[0];
    } else {
      msg = `Multiple users with **${user}** have been found: `;
      array.forEach(usr => {msg = msg + usr.user.tag + " ";});
      console.log("MSG   : ", msg);
      if(!dry){message.channel.send(msg);}
    }
  }
  return null;
}

async function find_nick(user, message, dry){
  let res = await fetch_Members(message);

  nicks = [];
  unames = [];
  tags = [];
  
  for(let i=0; i < ms.length; i++) {
    m = ms[i];
    nickname = m.nickname;
    if(nickname!=null){
      ptag_start = nickname.lastIndexOf(' [');
      if (ptag_start != -1) {
	nickname = nickname.slice(0,ptag_start);
      }
    }
    if(nickname == user) { nicks.push(m);	}
    if(m.user.username == user) { unames.push(m); }
    if(m.user.tag == user) { tags.push(m); }
  }

  usr = is_user_found(nicks, message, user, dry);
  if (usr == null){usr = is_user_found(unames, message, user, dry);}
  if (usr == null){usr = is_user_found(tags, message, user, dry);}
  if (usr != null) {
    console.log("INFO  : ", "User was found by UID ", usr.user.tag);
  } else {
    msg = `Couldn't determine an user with the provided argument **${user}**`;
    console.log("MSG   : ", msg);
    if(!dry){message.channel.send(msg);}
  }
  return usr;
}
