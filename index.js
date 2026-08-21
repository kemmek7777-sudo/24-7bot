const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1418960523747397755';
const GUILD_ID = '1320900808195178567';

const commands = [
    new SlashCommandBuilder()
        .setName('ak')
        .setDescription('إرسال رسالة جماعية في الخاص مع إمكانية التاغ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('الرسالة المراد إرسالها')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('members_count')
                .setDescription('عدد الأعضاء المراد الإرسال لهم')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('tag_user')
                .setDescription('هل تريد إضافة تاغ (منشن) للعضو في البداية؟ (True / False)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delay')
                .setDescription('التأخير بين كل رسالة بالثواني (الافتراضي: 3 ثواني)')
                .setRequired(false))
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`🤖 البوت ${client.user.tag} جاهز!`);

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('✅ تم إعادة تسجيل أمر /ak بنجاح!');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء تسجيل الأمر:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ak') {
        const messageToSend = interaction.options.getString('message');
        const targetCount = interaction.options.getInteger('members_count');
        const shouldTag = interaction.options.getBoolean('tag_user') ?? true; // افتراضياً يفعل التاغ
        const delaySeconds = interaction.options.getInteger('delay') || 3;

        await interaction.reply({ 
            content: `🔄 جاري سحب الأعضاء وبدء الإرسال لـ **${targetCount}** عضو...`, 
            ephemeral: true 
        });

        try {
            const allMembers = await interaction.guild.members.fetch();
            const members = [...allMembers.values()].filter(m => !m.user.bot);
            const selectedMembers = members.slice(0, targetCount);

            let sent = 0;
            let failed = 0;

            for (const member of selectedMembers) {
                try {
                    // إذا كان خيار التاغ مفعلاً يضيف منشن العضو في بداية الرسالة
                    const fullMessage = shouldTag ? `<@${member.id}>\n\n${messageToSend}` : messageToSend;
                    
                    await member.send(fullMessage);
                    sent++;
                    console.log(`✅ (${sent}/${selectedMembers.length}) تم الإرسال إلى: ${member.user.tag}`);
                } catch (err) {
                    failed++;
                    console.log(`❌ فشل الإرسال إلى: ${member.user.tag} (الخاص مغلق)`);
                }

                await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            }

            await interaction.followUp({ 
                content: `🎉 **اكتملت العملية!**\n📊 **العدد المطلوب:** ${targetCount}\n✅ **تم الإرسال بنجاح:** ${sent}\n❌ **فشل (الخاص مغلق):** ${failed}`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({ 
                content: '❌ حدث خطأ أثناء محاولة جلب الأعضاء أو الإرسال.', 
                ephemeral: true 
            });
        }
    }
});
// آلية حماية الذاكرة لضمان العمل 24/7 دون انقطاع
setInterval(() => {
    if (global.gc) {
        global.gc();
    }
    // إعادة فحص اتصال الصوت وتنشيطه
    connectToVoice();
}, 15 * 60 * 1000); // تنظيف كل 15 دقيقة

client.login(TOKEN);
