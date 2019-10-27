//import { getUserID } from './twitchUtils';
//const getUserID = require('./twitchUtils.js');
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const fetch = require("node-fetch")

client.on('ready', () => {
    console.log(`Bot started, ${client.users.size} users, active in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
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

    if(message.author.bot) return;

    if(message.content.indexOf(config.prefix) !== 0) return;

    const args  = message.content.slice(config.prefix.length).trim().split(/ +/g);

    const command = args.shift().toLowerCase();

    console.log(args);

    if(command === "ping") {
        const m = await message.channel.send("Ping");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp} ms. API latency is ${Math.round(client.ping)}ms`);
    }

    if(command === "follow") {
        var twitchUser = args[0];
        var userID = getUserID(twitchUser);

        
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
        return(response.data[0].id);
    })
}