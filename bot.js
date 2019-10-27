const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const request = require('request');

client.on('ready', () => {
    console.log("I am ready!");
})

client.on('message', async message => {

    if(message.author.bot) return;

    if(message.content.indexOf(config.prefix) !== 0) return;

    const args  = message.content.slice(config.prefix.length).trim().split(/ +/g);

    const command = args.shift().toLowerCase();

    if(command === "ping") {
        const m = await message.channel.send("Ping");
        m.edit('Pong! Latency is ${m.createdTimeStamp - message.createdTimeStamp} ms. API latency is ${Math.round(client.ping)}ms')
    }


    if (message.content == "ping") {
        message.reply("pong");
    }
});

client.login();