const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fetch = require("node-fetch");
const express = require("express");
const http = require("http");

const server = express();
var serverController;
const ip;

var channels = ["alyska", "jessie_k_"];

client.on("ready", () => {
  console.log(
    `Bot started, ${client.users.size} users, active in ${client.channels.size} channels of ${client.guilds.size} guilds.`
  );

  startServers();



});


client.on("guildCreate", guild => {
  console.log(`Joined guild: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers.`);
});

client.on("guildDelete", guild => {
  console.log(`Bot has been removed from ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers.`);
});

client.on("message", async message => {
  if (message.author.bot) return;

  if (message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g);

  const command = args.shift().toLowerCase();

  console.log(args);

  if (command === "ping") {
    const m = await message.channel.send("Ping");
    m.edit(
      `Pong! Latency is ${m.createdTimestamp -
      message.createdTimestamp} ms. API latency is ${Math.round(
        client.ping
      )}ms`
    );
  }

  if (command === "follow") {
    var twitchUser = args[0];
    var userID = getUserID(twitchUser);
    channels.push(twitchUser);

  }

  if (command === "unsub") {
    unsubscribe();
  }

});

async function getUserID(userName) {
  var url = "https://api.twitch.tv/helix/users?login=" + userName;

  const response = await fetch(url, {
    headers: {
      "Client-ID": `${config.twitchClientID}`
    }
  });

  var json = await response.json();
  return json.data[0].id;
}

async function initWebhooks() {
  //Initializes webhook subscriptions with the twitch channels listed in the channels array

  console.log("Initializing webhooks...");

  //Iterate over the channels array and send subscription requests to twitch
  var length = channels.length;

  for (var i = 0; i < length; i++) {
    var item = channels[i];
    var index = i;
    console.log(`Initializing webhook subscription for channel ${index}: ${item}`)

    await subscribeWebHook(item);

  }

}

async function subscribeWebHook(channel) {


  var userID = await getUserID(channel);

  var topic = "https://api.twitch.tv/helix/users/follows?first=1&to_id=" + userID;
  var live = "https://api.twitch.tv/helix/streams?user_id=" + userID;

  var url = "https://api.twitch.tv/helix/webhooks/hub";
  console.log(topic)
  const data = {
    "hub.callback": "http://" + ip + "/",
    "hub.mode": "subscribe",
    "hub.topic": live,
    "hub.lease_seconds": "864000",
    "hub.secret": "test"
  };

  console.log("sending post request")
  var responseData = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),

    headers: {
      "client-ID": config.twitchClientID,
      "Content-Type": "application/json"
    }
  })

}

function startServers() {
  //start an Express server and listen for the GET verification request from twitch


  console.log("starting Express server");

  server.use(express.json())

  server.get("/", (req, res) => {
    console.log("received get request")
    var challenge = req.query["hub.challenge"];
    console.log("challenge recieved: " + challenge);
    res.send(challenge);
    console.log("response sent");

  })

  server.post("/", (req, res) => {
    console.log("received post request from webhook");
    res.sendStatus(200);
    console.log(req.body)
    
    console.log(req.headers.link)
    var link = req.headers.link

    if(link.search("follows") !== -1) {
      var channel = req.body.data[0].to_name;
      var follower = req.body.data[0].from_name;

      client.channels.find("name", "twitch-alerts").send(follower + " just followed " + channel + " on Twitch!!")
    }

    


  }).listen(80, () => initWebhooks());



}

async function unsubscribe() {
  console.log("Unhooking...");

  //Iterate over the channels array and send subscription requests to twitch
  var length = channels.length;

  for (var i = 0; i < length; i++) {
    var item = channels[i];
    console.log(channels[i])
    var index = i;
    console.log(`Unsubscribing from channel ${index}: ${item}`)

    var userID = await getUserID(item);

    //preparing to switch webhook type to stream status
    var topic = "https://api.twitch.tv/helix/users/follows?first=1&to_id=" + userID;
    var live = "https://api.twitch.tv/helix/streams?user_id=" +userID;

    var url = "https://api.twitch.tv/helix/webhooks/hub";
    console.log(topic)
    const data = {
      "hub.callback": "http://" + ip + "/",
      "hub.mode": "unsubscribe",
      "hub.topic": live,
      "hub.lease_seconds": "864000",
      "hub.secret": "test"
    };

    console.log("sending post request")
    var responseData = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),

      headers: {
        "client-ID": config.twitchClientID,
        "Content-Type": "application/json"
      }
    })

    var url = "https://api.twitch.tv/helix/webhooks/hub";
    console.log(topic)
    const data2 = {
      "hub.callback": "http://" + ip + "/",
      "hub.mode": "unsubscribe",
      "hub.topic": topic,
      "hub.lease_seconds": "864000",
      "hub.secret": "test"
    };

    console.log("sending post request")
    var responseData = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),

      headers: {
        "client-ID": config.twitchClientID,
        "Content-Type": "application/json"
      }
    })
  }

}

client.login(config.token);

process.on('SIGINT', async () => {
  unsubscribe();
  
  const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

  console.log('Bot is shutting down...');
  await snooze(2000);
  console.log('bye!');

  process.exit(0);
});
