import got from 'got';
// const got = require('got');

// require('dotenv').config();
import 'dotenv/config';

// const TelegramApi = require('node-telegram-bot-api');
import TelegramApi from 'node-telegram-bot-api';

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
  // { command: '/info', description: 'Get a username' },
  { command: '/recognize', description: 'Recognize photos' },
  { command: '/game', description: 'Play the "Guess" game' },
  // { command: '/dontclickthis', description: '!Не нажимай сюда!' },
]);

const start = () => {
  function imageParser(arr) {
    let text = 'The photo shows: \n';
    for (let i = 0; i < 8; i += 1) {
      text += `"${arr[i].tag.en}", confidence: ${Math.round(arr[i].confidence)}%, \n`;
    }
    return text;
  }

  bot.on('message', async (msg) => {
    // console.log(msg);
    const { text } = msg;
    const chatId = msg.chat.id;
    if (text === '/start') {
      return bot.sendMessage(chatId, `Hello, ${msg.from.first_name}! I'm telegram bot tg_0903_bot.`);
      // await bot.sendMessage(chatId, 'Hello! I\'m telegram bot tg_0903_bot.');
      // return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/89b/055/89b05531-e12c-36dd-86ab-d7301005406f/8.webp');
    }
    // if (text === '/info') {
    //   return bot.sendMessage(chatId, `Your name is ${msg.from.first_name}`);
    // }
    if (text === '/recognize') {
      // let description = '';
      await bot.sendMessage(chatId, 'Upload your photo');
      if (msg.photo && msg.photo[msg.photo.length - 1]) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        // console.log('fileId =============> ', fileId);
        try {
          const image = await bot.getFile(fileId);
          // console.log('image ============> ', image);

          const url = `https://api.telegram.org/file/bot${process.env.TG_TOKEN}/${image.file_path}`;
          // console.log(url);

          const apiKey = 'acc_52af968c4d24992';
          const apiSecret = 'ef6e4a3bf317c39627bd379fe7777572';
          const imageUrl = `https://api.imagga.com/v2/tags?image_url=${url}`;

          (async () => {
            try {
              // const id = req.session.userid;
              const response = await got(imageUrl, { username: apiKey, password: apiSecret });
              // console.log(response);
              const body = JSON.parse(response.body);
              // console.log(body.result.tags);
              const description = imageParser(body.result.tags);
              console.log(description);
              await bot.sendMessage(chatId, description);
              // await Image.create({ url, body: description, user_id: id });
              // req.session.url = url;
              // req.session.description = description;
              // res.redirect('/user/profile');
            } catch (error) {
              console.log(error.response);
            }
          })();
        } catch (error) {
          console.log(error);
        }
      }
      // return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/89b/055/89b05531-e12c-36dd-86ab-d7301005406f/3.webp');
    }
    // if (text === '/dontclickthis') {
    //   return bot.sendMessage(chatId, 'Рушан любит Олечку!');
    // }
    if (text === '/game') {
      await bot.sendMessage(chatId, 'I\'ll think of a number from 0 to 9, and you try to guess this number.');
      const randomNum = Math.floor(Math.random() * (9 - 0 + 1)) + 0;
      chats[chatId] = randomNum;
      return bot.sendMessage(chatId, 'Ok, I got it! What do you think is my number?', gameOptions);
    }
    return bot.sendMessage(chatId, 'I don\'t understand what you mean. Try again.');
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
