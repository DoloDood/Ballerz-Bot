import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = 'YOUR_DISCORD_APP_ID_HERE';
const TOKEN = process.env.DISCORD_TOKEN;

const commands = [
  new SlashCommandBuilder()
    .setName('link-wallet')
    .setDescription('Link your Flow wallet to BallerzBot'),
  new SlashCommandBuilder()
    .setName('my-ballerz')
    .setDescription('View your Ballerz NFTs from your linked wallet'),
  new SlashCommandBuilder()
    .setName('submit-wallet')
    .setDescription('Submit your Flow wallet address to complete linking')
    .addStringOption(option =>
      option.setName('wallet')
        .setDescription('Your Flow wallet address')
        .setRequired(true)
    ),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})();
