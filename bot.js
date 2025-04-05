import { Client, GatewayIntentBits, Collection, SlashCommandBuilder, REST, Routes, InteractionType } from 'discord.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
dotenv.config();

// Replace this with your bot's App ID (from the Discord Developer Portal)
const CLIENT_ID = '1357872922399740015';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const walletLinks = new Map(); // Store wallet addresses for now

client.once('ready', async () => {
  console.log(`🤖 BallerzBot is online as ${client.user.tag}`);

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

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  // Your server's Guild ID (right-click server → Copy Server ID)
  const GUILD_ID = '1190788582101753916';

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash command registered for your server');
  } catch (err) {
    console.error('❌ Error registering commands', err);
  }
});


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'link-wallet') {
    const signatureMsg = `Sign this message to link your wallet to Discord ID ${interaction.user.id}. Code: ${uuidv4()}`;

    // Simulate this by asking them to manually reply with their wallet for now
    await interaction.reply({
      content: `🔗 To link your Flow wallet:\n\n1. Sign this message in Blocto/Dapper (simulation for now):\n\`\`\`${signatureMsg}\`\`\`\n2. Reply here with your Flow wallet address.`,
      ephemeral: true,
    });

    // Listen for their next message with wallet address (basic version)
    const filter = (msg) => msg.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', msg => {
      const address = msg.content.trim();
      walletLinks.set(interaction.user.id, address);
      msg.reply(`✅ Wallet \`${address}\` linked to your account!`);
    });
  }

  if (interaction.commandName === 'my-ballerz') {
    const userId = interaction.user.id;
    const wallet = walletLinks.get(userId);

    if (!wallet) {
      await interaction.reply({ content: `❌ You haven't linked a wallet yet. Use /link-wallet first.`, ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const { data } = await axios.get(`https://rest-mainnet.graffle.org/accounts/${wallet}/nfts`);
      
      // Filter Ballerz NFTs (based on collection name or ID)
      const ballerz = data.data.filter(nft =>
        nft.collection?.toLowerCase().includes('ballerz')
      );

      if (ballerz.length === 0) {
        await interaction.editReply(`🕵️ No Ballerz found in wallet \`${wallet}\`.`);
      } else {
        const ballerzList = ballerz.map(nft => {
          const name = nft.display?.name || `Ballerz #${nft.id}`;
          return `#${nft.id} – ${name}`;
        }).join('\n');

        await interaction.editReply(`🏀 Found ${ballerz.length} Ballerz NFT(s):\n\`\`\`\n${ballerzList}\n\`\`\``);
      }

    } catch (err) {
      console.error('❌ Error fetching from Graffle:', err);
      await interaction.editReply(`❌ Error fetching Ballerz. Try again later.`);
    }
  }

  if (interaction.commandName === 'submit-wallet') {
    const userId = interaction.user.id;
    const address = interaction.options.getString('wallet');

    walletLinks.set(userId, address);
    await interaction.reply({
      content: `✅ Wallet \`${address}\` linked to your account!`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
