require('dotenv').config();

const TelegramApi = require('node-telegram-bot-api');

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
  { command: '/start', description: 'Приветствие' },
  { command: '/info', description: 'Получить имя пользователя' },
  { command: '/want', description: 'Узнать, чего хочет кот' },
  { command: '/game', description: 'Поиграть с котом' },
  { command: '/dontclickthis', description: '!Не нажимай сюда!' },
]);

const start = () => {
  bot.on('message', async (msg) => {
    // console.log(msg);
    const { text } = msg;
    const chatId = msg.chat.id;
    // if (msg.photo && msg.photo[3]) {
    if (msg.photo && msg.photo[0]) {
      // console.log(msg.photo[3].file_id);
      // const fileId = msg.photo[3].file_id;
      const fileId = msg.photo[0].file_id;
      console.log(fileId, '======> fileId');
      try {
        const image = await bot.getFile({ file_id: fileId });
        console.log(image, '============> image');
      } catch (error) {
        console.log(error);
      }
    }
    if (text === '/start') {
      await bot.sendMessage(chatId, 'Hello! I\'m telegram bot tg_0903_bot. =======)');
      return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/89b/055/89b05531-e12c-36dd-86ab-d7301005406f/8.webp');
    }
    if (text === '/info') {
      return bot.sendMessage(chatId, `Your name is ${msg.from.first_name}`);
    }
    if (text === '/want') {
      return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/89b/055/89b05531-e12c-36dd-86ab-d7301005406f/3.webp');
    }
    if (text === '/dontclickthis') {
      return bot.sendMessage(chatId, 'Рушан любит Олечку!');
    }
    if (text === '/game') {
      await bot.sendMessage(chatId, 'Я загадаю число от 0 до 9, а ты попробуй отгадать это число.');
      const randomNum = Math.floor(Math.random() * (9 - 0 + 1)) + 0;
      chats[chatId] = randomNum;
      return bot.sendMessage(chatId, 'Всё! Я загадал. Как ты думаешь, какое это число?', gameOptions);
    }
    return bot.sendMessage(chatId, 'Я не понимаю, что ты имеешь в виду. Попробуй написать по-другому.');
  });

  bot.on('callback_query', async (msg) => {
    const { data } = msg;
    const chatId = msg.message.chat.id;
    if (chats[chatId]) {
      if (Number(data) === chats[chatId]) {
        chats[chatId] = false;
        return bot.sendMessage(chatId, `Поздравляю! Всё верно! Я загадал ${data}`);
      }
      return bot.sendMessage(chatId, 'Попробуй еще раз');
    }
    return bot.sendMessage(chatId, 'Я ещё не загадал число. Начни игру заново /game');
  });
};

start();
