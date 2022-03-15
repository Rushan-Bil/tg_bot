import got from 'got';
import 'dotenv/config';
import TelegramApi from 'node-telegram-bot-api';

import * as textToSpeech from '@google-cloud/text-to-speech';
// const fs = require('fs');
import * as fs from 'fs';
import * as util from 'util';
// const util = require('util');

const client = new textToSpeech.TextToSpeechClient();
async function getVoice(textToVoice) {
  // The text to synthesize
  const text = textToVoice;

  // Construct the request
  const request = {
    input: { text },
    // Select the language and SSML voice gender (optional)
    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    // select the type of audio encoding
    audioConfig: { audioEncoding: 'MP3' },
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('output.mp3', response.audioContent, 'binary');
  console.log('Audio content written to file: output.mp3');
}

const token = process.env.TG_TOKEN;

const bot = new TelegramApi(token, { polling: true });
const chats = {};
const gameOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: '1', callback_data: '1' }, { text: '2', callback_data: '2' }, { text: '3', callback_data: '3' }],
      [{ text: '4', callback_data: '4' }, { text: '5', callback_data: '5' }, { text: '6', callback_data: '6' }],
      [{ text: '7', callback_data: '7' }, { text: '8', callback_data: '8' }, { text: '9', callback_data: '9' }],
      [{ text: '0', callback_data: '0' }],
    ],
  }),
};

bot.setMyCommands([
  { command: '/start', description: 'Start' },
  { command: '/recognize', description: 'Recognize photos' },
  { command: '/game', description: 'Play the "Guess" game' },
]);

const start = () => {
  function imageParser(arr) {
    let text = 'On your photo: \n';
    for (let i = 0; i < 8; i += 1) {
      text += `"${arr[i].tag.en}", confidence: ${Math.round(arr[i].confidence)}%, \n`;
    }
    return text;
  }

  bot.on('message', async (msg) => {
    const { text } = msg;
    const chatId = msg.chat.id;

    switch (text) {
      case '/start':
        return bot.sendMessage(chatId, `Hello, ${msg.from.first_name}! I'm telegram bot tg_0903_bot.`);

      case '/recognize':
        return bot.sendMessage(chatId, 'Upload your photo');

      case '/game':
        await bot.sendMessage(chatId, 'I\'ll think of a number from 0 to 9, and you try to guess this number.');
        const randomNum = Math.floor(Math.random() * (9 - 0 + 1)) + 0;
        chats[chatId] = randomNum;
        return bot.sendMessage(chatId, 'Ok, I got it! What do you think is my number?', gameOptions);

      default:
        if (msg.photo && msg.photo[msg.photo.length - 1]) {
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          try {
            const image = await bot.getFile(fileId);
            const url = `https://api.telegram.org/file/bot${process.env.TG_TOKEN}/${image.file_path}`;
            const apiKey = process.env.IMAGGA_API_KEY;
            const apiSecret = process.env.IMAGGA_API_SECRET;
            const imageUrl = `https://api.imagga.com/v2/tags?image_url=${url}`;

            (async () => {
              try {
                const response = await got(imageUrl, { username: apiKey, password: apiSecret });
                const body = JSON.parse(response.body);
                const description = imageParser(body.result.tags);
                console.log(description);
                await getVoice(description);
                return bot.sendMessage(chatId, description);
              } catch (error) {
                console.log(error.response);
              }
            })();
          } catch (error) {
            console.log(error);
          }
        } else {
          return bot.sendMessage(chatId, 'I don\'t understand what you mean. Try again.');
        }
    }
  });

  bot.on('callback_query', async (msg) => {
    const { data } = msg;
    const chatId = msg.message.chat.id;
    if (chats[chatId]) {
      if (Number(data) === chats[chatId]) {
        chats[chatId] = false;
        return bot.sendMessage(chatId, `Congratulations! That's right! My nubmer is ${data}`);
      }
      return bot.sendMessage(chatId, 'Try again');
    }
    return bot.sendMessage(chatId, 'I\'m not ready yet. Restart the /game');
  });
};

start();
