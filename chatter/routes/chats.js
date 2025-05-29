import express from 'express';
var router = express.Router();

let pool;
let chat_ServerList = {};

/* GET users listing. */
const load_chats = async (id) => {
  try {
    const sql = `
SELECT
  c.id AS chat_id,
  c.name AS chat_name,
  r.new_message AS new_messages,

  m.id AS message_id,
  m.sender_id,
  u.display_name AS sender_display_name,
  m.message,
  m.date_sent

FROM chat_members cm
JOIN chats c ON cm.chat_id = c.id
JOIN read_messages r ON r.chat_id = c.id AND r.user_id = cm.user_id

LEFT JOIN (
  SELECT m1.*
  FROM chat_messages m1
  INNER JOIN (
    SELECT chat_id, MAX(date_sent) AS max_date
    FROM chat_messages
    GROUP BY chat_id
  ) m2 ON m1.chat_id = m2.chat_id AND m1.date_sent = m2.max_date
) m ON m.chat_id = c.id

LEFT JOIN users u ON m.sender_id = u.id

WHERE cm.user_id = ? AND cm.exit_date > CURRENT_DATE
ORDER BY m.date_sent DESC;
    `;
    const results = await pool(sql, [id]);
    return results;
  }
  catch (err) {
    throw err;
  }

};

const load_messages = async (user_id, chat_id) => {
  try {
    const sql_chatInfo = `SELECT
  c.id AS chat_id,
  c.name AS chat_name,

  a.user_id AS admin_id,
  admin.display_name AS admin_display_name


FROM chat_members cm
JOIN chats c ON cm.chat_id = c.id 

LEFT JOIN chat_administrators a 
  ON c.id = a.chat_id AND a.current_admin = TRUE
  LEFT JOIN users admin ON a.user_id = admin.id

WHERE cm.user_id = ? AND cm.chat_id = ? AND cm.exit_date > CURRENT_DATE
`;
    const chatInfo_results = await pool(sql_chatInfo, [user_id, chat_id]);

    if (!chatInfo_results.length) {
      throw new Error('Could not find valid chatroom')
    }

    const sql_messages = `SELECT
  m.id AS message_id,
  m.sender_id,
  sender.display_name AS sender_display_name,
  m.message,
  m.date_sent

FROM chat_members cm
LEFT JOIN chat_messages m ON cm.chat_id = m.chat_id
LEFT JOIN users sender ON m.sender_id = sender.id

WHERE cm.user_id = ? AND cm.chat_id = ? AND cm.exit_date > CURRENT_DATE
ORDER BY m.date_sent DESC;
`;
    const messages_results = await pool(sql_messages, [user_id, chat_id]);

    const results = { chat: chatInfo_results[0], messages: messages_results };
    return results;
  }
  catch (err) {
    throw err;
  }

};

const upload_message = async (user_id, chat_id, message) => {
  try {
    if (!user_id && !chat_id && !message) { throw new Error('Invalid Data') }
    const add_messageSQL = `
    INSERT INTO chat_messages (chat_id, sender_id, message)
    VALUES (?,?,?)
    `;
    const add_messageResults = await pool(add_messageSQL, [chat_id, user_id, message]);
    if (add_messageResults.affectedRows) {
      const newId = add_messageResults.insertId;
      const update_readMessagesSQL = `
    UPDATE read_messages SET new_message = 1 WHERE chat_id = ?;
    `;
      await pool(update_readMessagesSQL, [chat_id]);
      if (!newId) { throw new Error('Cant retrieve new Message') }

      const get_messageSQL = `SELECT
      cm.id AS message_id,
      cm.chat_id,
      cm.date_sent,
      cm.message,
      c.name AS chat_name,
      sender.display_name AS sender_name
      FROM chat_messages cm
      LEFT JOIN chats c ON cm.chat_id = c.id
      LEFT JOIN users sender ON cm.sender_id = sender.id
      WHERE cm.id = ?
      `;
      const newMessage = await pool(get_messageSQL, [newId]);
      const new_message = newMessage[0];
      if (new_message)
        return new_message;
      else { return; }
    }
  }
  catch (err) {
    throw err;
  }
};
function setupChatSockets(io) {
  io.on('connection', (socket) => {
    const session = socket.handshake.session;
    const user = session.loggedIn;

    if (!user || !user.id) {
      console.log("Unauthenticated socket connection");
      socket.disconnect();
      return;
    }
    console.log(`User ${user.id} connected via socket`);
    socket.emit('connection_successfull', user);

    socket.on('get_chatList', async (callback) => {
      const chats = await load_chats(user.id);
      if (chats.length) {
        chats.forEach(chat => {
          if (chat_ServerList[chat.chat_id]) {
            chat_ServerList[chat.chat_id].push({ user_id: user.id, socket });
          }
          else {
            chat_ServerList[chat.chat_id] = [{ user_id: user.id, socket }];
          }
        });
        callback(chats)
      }
    });

    socket.on('get_messagePage', async ({ chat_id }, callback) => {
      if (chat_id) {
        const result = await load_messages(user.id, chat_id);
        callback(result)
      }
    });

    socket.on('submit_message', async ({ chat_id, message }) => {
      if (chat_id && message) {
        const new_message = await upload_message(user.id, chat_id, message);

        if (new_message && chat_ServerList[new_message.chat_id]) {
          chat_ServerList[new_message.chat_id].forEach(({ socket }) => {
            socket.emit('new_message', new_message);
          });
        }
      }
    });

    socket.on('opened_chat', async (chat_id) => {
      if (chat_id) {
        const update_readMessages = `UPDATE read_messages SET new_message = 0 WHERE chat_id = ? AND user_id = ?`;
        await pool(update_readMessages, [chat_id, user.id])
      }
    });

  });
}
router.use((req, res, next) => {
  if (!pool) {
    pool = req.pool;
  }
  next();
})
router.get('/', async function (req, res, next) {
  try {
    if (req.session.loggedIn) {
      const user = req.session.loggedIn;
      if (!user.id) {
        throw new Error("missing valid ID")
      }
      res.render('messaging_homePage', {
        title: 'Chats'
      });
    }
    else {
      res.redirect('/Chatters/auth/Sign_In');
    }

  } catch (err) {
    next(err); // Pass error to global error handler
  }
});


router.get('/log_out', (req, res, next) => {
  req.session.destroy(() => res.redirect('/Chatters'));
});

// Global error handler
router.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Server Error');
});


export { router as default, setupChatSockets };
