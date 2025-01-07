const makeWASocket = require('@adiwajshing/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');

(async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Conexión cerrada. Reintentando:', shouldReconnect);
            if (shouldReconnect) start();
        } else if (connection === 'open') {
            console.log('¡Conexión abierta!');
        }
    });

    sock.ev.on('messages.upsert', async (msg) => {
        console.log('Mensaje recibido:', JSON.stringify(msg, null, 2));
        const message = msg.messages[0];

        if (message.message) {
            const jid = message.key.remoteJid;

            if (message.message.conversation === 'menu') {
                const buttons = [
                    { buttonId: 'btn1', buttonText: { displayText: 'Opción 1' }, type: 1 },
                    { buttonId: 'btn2', buttonText: { displayText: 'Opción 2' }, type: 1 },
                    { buttonId: 'btn3', buttonText: { displayText: 'Opción 3' }, type: 1 },
                ];

                const buttonMessage = {
                    text: 'Selecciona una opción:',
                    footer: 'Prueba de botones',
                    buttons: buttons,
                    headerType: 1,
                };

                await sock.sendMessage(jid, buttonMessage);
            }

            if (message.message.buttonsResponseMessage) {
                const selectedButtonId = message.message.buttonsResponseMessage.selectedButtonId;
                await sock.sendMessage(jid, { text: `Elegiste la opción: ${selectedButtonId}` });
            }
        }
    });
})();
