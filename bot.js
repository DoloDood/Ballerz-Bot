import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
dotenv.config();

// Discord App & Guild Info
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Store wallet addresses in memory
const walletLinks = new Map();

client.once('ready', async () => {
  console.log(`🤖 BallerzBot is online as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('link-wallet')
      .setDescription('Link your Flow wallet to BallerzBot'),
    new SlashCommandBuilder()
      .setName('submit-wallet')
      .setDescription('Submit your Flow wallet address to complete linking')
      .addStringOption(option =>
        option.setName('wallet')
          .setDescription('Your Flow wallet address')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('my-ballerz')
      .setDescription('View your Ballerz NFTs from your linked wallet'),
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered for your server');
  } catch (err) {
    console.error('❌ Error registering commands', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'link-wallet') {
    const signatureMsg = `Sign this message to link your wallet to Discord ID ${interaction.user.id}. Code: ${uuidv4()}`;

    await interaction.reply({
      content: `🔗 To link your Flow wallet:\n\n1. Sign this message in Blocto/Dapper (simulation for now):\n\`\`\`${signatureMsg}\`\`\`\n2. Then run /submit-wallet to finish linking.`,
      ephemeral: true,
    });
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

  if (interaction.commandName === 'my-ballerz') {
    const userId = interaction.user.id;
    const wallet = walletLinks.get(userId);

    if (!wallet) {
      await interaction.reply({
        content: `❌ You haven't linked a wallet yet. Use /link-wallet first.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

const { data } = await axios.get(
  `https://flowdiver.io/api/nfts?wallet=${wallet.toLowerCase()}`,
  { timeout: 7000 }
);

      const ballerz = response.data.nfts.filter(nft =>
        nft.collection_name?.toLowerCase().includes('ballerz')
      );

      if (ballerz.length === 0) {
        await interaction.editReply(`🕵️ No Ballerz found in wallet \`${wallet}\`.`);
      } else {
        const ballerzList = ballerz.map(nft =>
          `#${nft.token_id} – ${nft.name || 'Unnamed Ballerz'}`
        ).join('\n');

        await interaction.editReply(`🏀 Found ${ballerz.length} Ballerz NFT(s):\n\`\`\`\n${ballerzList}\n\`\`\``);
      }
    } catch (err) {
      console.error('❌ Error fetching from Flowdiver:', err.message);
      await interaction.editReply(`❌ Error fetching Ballerz. Try again later.`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
