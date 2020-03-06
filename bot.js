const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const fetch = require("node-fetch");
const express = require('express');
const getIP = require('external-ip')();

var ip;


client.on('ready', () => {
    console.log(`Bot started, ${client.users.size} users, active in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

    getExternalIp();
});

client.on('guildCreate', guild => {
    console.log(`Joined guild: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers.`);
});

client.on('guildDelete', guild => {
    console.log(`Bot has been removed from ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers.`);
})

client.on('message', async message => {

    if (message.author.bot) return;

    if (message.content.indexOf(config.prefix) !== 0) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);

    const command = args.shift().toLowerCase();

    console.log(args);

    if (command === "ping") {
        const m = await message.channel.send("Ping");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp} ms. API latency is ${Math.round(client.ping)}ms`);
    }

    if (command === "follow") {
        var twitchUser = args[0];
        var userID = getUserID(twitchUser);

        //start an Express server and listen for the GET verification request from twitch

        const server = express();

        server.get('/', (req, res) => {
            var challenge = req.query['hub.challenge'];
            console.log(challenge)
            res.send(challenge);
            console.log('response sent')
        }).listen(80, () => console.log('Server listening on port 90'));

        //POST the subscription request
        console.log('fetching')
        console.log('host ip address: ' + ip)


        var url = 'https://api.twitch.tv/helix/webhooks/hub';
        const data = {
            'hub.callback': `${ip}`,
            'hub.mode': 'subscribe',
            'hub.topic': `https://api.twitch.tv/helix/users/follows?first=1&to_id=${userID}`,
            'hub.lease_seconds': '864000',
            'hub.secret': 'test'
        }

        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),

            headers: {
                'client-ID': config.twitchClientID,
            }
        })

        server.post('/', (req, res) => {
            console.log('Webhook notification received');
            res.sendStatus(200);

            console.log(req);
            
            client.channels.find("name","twitch-alerts").send("new follow detected")

        })


    }


});

client.login(config.token);

function getUserID(userName) {
    var url = "https://api.twitch.tv/helix/users?login=" + userName;
    fetch(url, {
        headers: {
            'Client-ID': `${config.twitchClientID}`
        }
    }).then(resp => resp.json()).then(response => {

        console.log(`User ID for ${userName} is ${response.data[0].id}`);
        return (response.data[0].id);
    })
}

function getExternalIp() {
    getIP((err, ipAdd) => {
         if (err) {
             throw err;
         }
         ip = ipAdd;
    });
}