import express from 'express';
var router = express.Router();

let pool;
let chat_ServerList = {};

/////////////////
//  Functions  //
/////////////////

const get_total_numb_of_chats = async () => {
  try {
    const amountOf_chats = `SELECT 
    g.total_chats
    FROM global_stats g
    WHERE id = 1;
      `;
    const total = await pool(amountOf_chats, []);
    if (!total[0]?.total_chats) {
      throw new Error();
    }
    return total[0].total_chats;
  }
  catch (err) {
    throw Object.assign(new Error('Error getting number of chats, Please refresh page.'), { type: 'error' });
  }
};

// gets list of chats
const get_joinable_chats = async ({
  searchText = '',
  direction = 'forward', // 'forward' | 'backward'
  cursor = null, // { name: '', id: 0 }
  limit = 3
}) => {
  try {
    let sql = '';
    const params = [];
    const isSearch = !!searchText.trim();
    const pattern = `%${searchText.toLowerCase()}%`;
    if (!cursor) {
      cursor = direction === 'backward'
        ? { name: 'ZZZZZZZZ', id: Number.MAX_SAFE_INTEGER }
        : { name: '', id: 0 };
    }

    if (isSearch) {
      // SEARCH MODE (no pagination)
      sql = `
        SELECT 
          c.id AS chat_id,
          c.name AS chat_name,
          COUNT(cm.user_id) AS active_members,
          INSTR(LOWER(c.name), ?) AS position
        FROM chats c
        LEFT JOIN chat_members cm 
          ON cm.chat_id = c.id AND cm.exit_date > CURRENT_DATE
        WHERE c.exit_date > CURRENT_DATE AND LOWER(c.name) LIKE ?
        GROUP BY c.id, c.name
        ORDER BY position ASC, c.name ASC
      `;
      params.push(searchText.toLowerCase(), pattern);
    }
    else {
      // PAGINATED MODE
      sql = `
        SELECT 
          c.id AS chat_id,
          c.name AS chat_name,
          COUNT(cm.user_id) AS active_members
        FROM chats c
        LEFT JOIN chat_members cm 
          ON cm.chat_id = c.id AND cm.exit_date > CURRENT_DATE
        WHERE c.exit_date > CURRENT_DATE
      `;

      // Cursor-based pagination logic
      if (cursor && cursor.name) {
        if (direction === 'forward') {
          sql += ` AND (c.name > ? OR (c.name = ? AND c.id > ?))`;
        } else if (direction === 'backward') {
          sql += ` AND (c.name < ? OR (c.name = ? AND c.id < ?))`;
        }
        params.push(cursor.name, cursor.name, cursor.id);
      }

      sql += ` GROUP BY c.id, c.name`;

      sql += direction === 'backward'
        ? ` ORDER BY c.name DESC, c.id DESC`
        : ` ORDER BY c.name ASC, c.id ASC`;

      if (typeof limit === 'number') {
        sql += ` LIMIT ?`;
        params.push(limit);
      }
    }

    let result = await pool(sql, params) || [];
    if (!isSearch && direction === 'backward') {
      result = result?.reverse();
    }
    return result;
  } catch (err) {
    console.error(err)
    throw Object.assign(new Error('Error getting Chats, Please refresh page.'), { type: 'error' });
  }
};


// gets list of chats
const get_userList = async (id, last_display_name = '', last_id = 0, limit = 100) => {
  try {
    if (!id) { throw Object.assign(new Error('Missing credentials, Please refresh page.'), { type: 'error' }); }
    const sql = `
    SELECT u.id AS user_id, u.display_name
    FROM users u
    WHERE u.exit_date > CURRENT_DATE
      AND u.email_verified = TRUE
      AND u.id != ?
      AND (
        u.display_name > ?
        OR (u.display_name = ? AND u.id > ?)
      )
    ORDER BY u.display_name ASC, u.id ASC
    LIMIT ?
  `;
    const result = await pool(sql, [id, last_display_name, last_display_name, last_id, limit]) || [];
    return result;
  }
  catch (err) {
    throw Object.assign(new Error('Error getting Users, Please refresh page.'), { type: 'error' });
  }
};

const search_userList = async (id, searchText) => {
  try {
    if (!id || !searchText) { throw Object.assign(new Error('Missing credentials or search Text, Please refresh page.'), { type: 'error' }); }

    const searchTerm = searchText.toLowerCase();
    const pattern = `%${searchTerm}%`;

    const sql = `
      SELECT 
        u.id AS user_id, 
        u.display_name,
        INSTR(LOWER(u.display_name), ?) AS position
      FROM users u
      WHERE 
        u.exit_date > CURRENT_DATE
        AND u.email_verified = TRUE
        AND u.id != ?
        AND LOWER(u.display_name) LIKE ?
      ORDER BY 
        position ASC, 
        u.display_name ASC, 
        u.id ASC
    `;
    const result = await pool(sql, [searchTerm, id, pattern]) || [];
    return result;
  }
  catch (err) {
    throw Object.assign(new Error('Error getting Users, Please refresh page.'), { type: 'error' });
  }
};

const setUp_joinChatsList = async (limit) => {
  try {
    const total = await get_total_numb_of_chats();
    let showing = [];
    let next = [];
    let prev = [];

    showing = await get_joinable_chats({ direction: 'forward', limit });
    if (showing.length === 0) {
      throw Object.assign(new Error('Error getting Chats, Please refresh page.'), { type: 'error' });
    }
    const showingCursor = showing[showing.length - 1];
    next = await get_joinable_chats({ direction: 'forward', cursor: { name: showingCursor.chat_name, id: showingCursor.chat_id }, limit });
    prev = await get_joinable_chats({ direction: 'backward', limit: total % limit === 0 ? limit : total % limit });
    let joinChatList = {};
    joinChatList = {
      showing: {
        chats: showing,
        firstCursor: { name: showing[0]?.chat_name, id: showing[0]?.chat_id },
        lastCursor: { name: showing[showing.length - 1]?.chat_name, id: showing[showing.length - 1]?.chat_id }
      },
      next: {
        chats: next,
        firstCursor: { name: next[0]?.chat_name, id: next[0]?.chat_id },
        lastCursor: { name: next[next.length - 1]?.chat_name, id: next[next.length - 1]?.chat_id }
      },
      prev: {
        chats: prev,
        firstCursor: { name: prev[0]?.chat_name, id: prev[0]?.chat_id },
        lastCursor: { name: prev[prev.length - 1]?.chat_name, id: prev[prev.length - 1]?.chat_id }
      },
    };
    return joinChatList;
  }
  catch (err) {
    const message = err.message || 'Something went wrong';
    const type = err.type || 'error';
    throw Object.assign(new Error(message), { type });
  }
};

// gets list of a users chats with the last message sent and a flag if it was read yet
const load_user_chats = async (id) => {
  try {
    const sql = `
SELECT
  c.id AS chat_id,
  c.name AS chat_name,
  cm.join_date,
  COALESCE(r.new_message, FALSE) AS new_messages,

  m.id AS message_id,
  m.sender_id,
  u.display_name AS sender_display_name,
  m.message,
  m.date_sent,

  -- Computed "effective" date for ordering
  CASE 
    WHEN m.date_sent IS NOT NULL AND m.date_sent >= cm.join_date THEN m.date_sent
    ELSE cm.join_date
  END AS sort_date

FROM chat_members cm
JOIN chats c 
  ON cm.chat_id = c.id

LEFT JOIN read_messages r 
  ON r.chat_id = c.id AND r.user_id = cm.user_id

LEFT JOIN (
    SELECT m1.*
    FROM chat_messages m1
    INNER JOIN (
        SELECT chat_id, MAX(date_sent) AS max_date
        FROM chat_messages
        GROUP BY chat_id
    ) m2 
    ON m1.chat_id = m2.chat_id AND m1.date_sent = m2.max_date
) m 
  ON m.chat_id = c.id

LEFT JOIN users u 
  ON m.sender_id = u.id

WHERE cm.user_id = ?
  AND cm.exit_date > CURRENT_DATE

ORDER BY sort_date DESC;
    `;
    const results = await pool(sql, [id]) || [];
    console.log(id, ' ', results)
    return results;
  }
  catch (err) {
    throw Object.assign(new Error('Error getting your Chats, Please refresh page.'), { type: 'error' });
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
      throw Object.assign(new Error('Access denied: You are not a member of this chat.'), { type: 'error' });
    }

    const sql_messages = `SELECT
  m.id AS message_id,
  m.sender_id,
  sender.display_name AS sender_display_name,
  m.message,
  m.date_sent
FROM chat_messages m
LEFT JOIN users sender ON m.sender_id = sender.id
WHERE m.chat_id = ?
ORDER BY m.date_sent ASC;
`;
    const messages_results = await pool(sql_messages, [chat_id]) || [];

    return {
      chat: chatInfo_results[0],
      messages: messages_results
    };
  }
  catch (err) {
    const message = err.message || 'Error loading messages.';
    const type = err.type || 'error';
    throw Object.assign(new Error(message), { type });
  }
};

const upload_message = async (user_id, chat_id, message) => {
  try {
    if (!user_id || !chat_id || !message) {
      throw Object.assign(new Error('Error, missing credentials. Can\'t upload message.'), { type: 'error' });
    }

    const isUser = await verifyIf_Is_User(user_id, chatId);
    if (!isUser) {
      throw Object.assign(new Error('Access denied: You are not a member of this chat. You can\'t send messages.'), { type: 'error' });
    }

    const utcNow = new Date().toISOString(); // Always UTC   need to handle date better 
    const add_messageSQL = 'INSERT INTO chat_messages (chat_id, sender_id, date_sent, message) VALUES (?, ?, ?, ?)';
    const add_messageResults = await pool(add_messageSQL, [chat_id, user_id, utcNow, message]);

    if (add_messageResults.affectedRows) {
      console.log('in affectedRows: new ID is ', add_messageResults.insertId)
      const newId = add_messageResults.insertId;
      const update_readMessagesSQL = `
    UPDATE read_messages SET new_message = 1 WHERE chat_id = ?;
    `;

      await pool(update_readMessagesSQL, [chat_id]);
      if (!newId) {
        throw Object.assign(new Error('Error: Cant retrieve new Message.'), { type: 'error' });
      }

      const get_messageSQL = `SELECT
      cm.id AS message_id,
      cm.sender_id,
      sender.display_name AS sender_display_name,
      cm.message,
      cm.date_sent,
      cm.chat_id,
      c.name AS chat_name
      FROM chat_messages cm
      LEFT JOIN chats c ON cm.chat_id = c.id
      LEFT JOIN users sender ON cm.sender_id = sender.id
      WHERE cm.id = ?
      `;

      const newMessage = await pool(get_messageSQL, [newId]);
      console.log(newMessage[0])
      return newMessage[0] || null;
    }
  }
  catch (err) {
    const message = err.message || 'Error uploading message.';
    const type = err.type || 'error';
    throw Object.assign(new Error(message), { type });
  }
};

function cleanUpUser(userId) {
  for (const chatId in chat_ServerList) {
    if (!Array.isArray(chat_ServerList[chatId])) continue;

    // Remove entries for this user
    chat_ServerList[chatId] = chat_ServerList[chatId].filter(entry => !entry[userId]);

    // If no sockets remain for this chat, delete the chat entry
    if (chat_ServerList[chatId].length === 0) {
      delete chat_ServerList[chatId];
    }
  }
}
async function loadChat_info_page(chatId) {
  try {
    if (!chatId) {
      throw Object.assign(new Error('Error, missing credentials. Can\'t load chat info.'), { type: 'error' });
    }

    const get_Chat_infoSQL = `SELECT 
        c.id AS chat_id,
        c.name AS chat_name,
        c.create_date AS chat_create_date,
        c.details AS chat_details,
        admin.id AS admin_id,
        admin.display_name AS admin_name
      FROM chats c
      LEFT JOIN chat_administrators ca 
        ON c.id = ca.chat_id AND ca.current_admin = TRUE
      LEFT JOIN users admin 
        ON ca.user_id = admin.id
      WHERE c.id = ?;
      `;

    const Chat_infoResults = await pool(get_Chat_infoSQL, [chatId]) || [];

    const get_Chat_usersSQL = `
     SELECT 
        u.id AS user_id,
        u.display_name
      FROM chat_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.chat_id = ? 
        AND cm.exit_date > CURRENT_DATE
        AND u.exit_date > CURRENT_DATE;
        `;

    const Chat_usersResults = await pool(get_Chat_usersSQL, [chatId]) || [];

    return { Chat_info: Chat_infoResults[0], Chat_users: Chat_usersResults };

  }
  catch (err) {
    const message = err.message || 'Error loading chat info.';
    throw Object.assign(new Error(message), { type: 'error' });
  }
}

async function verifyIf_Is_User(user_id, chatId) {
  try {
    if (!user_id || !chatId) {
      throw Object.assign(new Error('Error, missing credentials. Can\'t verify chat user.'), { type: 'error' });
    }

    const verification = `
     SELECT * FROM chat_members cm WHERE cm.user_id = ? AND cm.chat_id = ? AND cm.exit_date > CURRENT_DATE;
     `;
    const verificationResults = await pool(verification, [user_id, chat_id]);
    return verificationResults.length > 0;
  }
  catch (err) {
    console.error(err)
    return false;
  }
}
/////////////////
// Socket code //
/////////////////

function setupChatSockets(io) {
  io.on('connection', async (socket) => {
    const session = socket.handshake.session;
    const user = session.loggedIn;
    const LIMIT = 3;

    if (!user || !user.id) {
      console.error("Unauthenticated socket connection");
      socket.emit('force_logout', {
        message: 'Unauthenticated socket connection.'
      });
      socket.disconnect(true);
    }

    try {
      let joinChatList = await setUp_joinChatsList(LIMIT);
      let userList = await get_userList(user.id);
      socket.emit('connection_successfull', { user, joinChatList, userList, LIMIT });
    }
    catch (err) {
      const message = err.message || 'Something went wrong';
      const type = err.type || 'error';
      sendToast(message, type);
    }

    socket.on('get_chatList', async (callback) => {
      try {
        const chats = await load_user_chats(user.id);
        chats.forEach(chat => {  // add socket to global list 
          if (!chat_ServerList[chat.chat_id]) {
            chat_ServerList[chat.chat_id] = [];
          }
          const userAlreadyExists = chat_ServerList[chat.chat_id].some(entry => user.id in entry);

          if (!userAlreadyExists) {
            chat_ServerList[chat.chat_id].push({ [user.id]: socket });
          }
        });
        callback(chats);
      }
      catch (err) {
        const message = err.message || 'Something went wrong';
        const type = err.type || 'error';
        sendToast(message, type);
        callback([]);
      }
    });

    socket.on('load_more_users', async ({ last_display_name = '', last_id = 0, emptyTable = false, refresh = false, toast }, callback) => {
      try {
        let users;
        if (refresh) {
          users = await get_userList(user.id);
        }
        else {
          users = await get_userList(user.id, last_display_name, last_id, 50);
        }
        if (users.length > 0) {
          sendToast(toast?.message, toast?.type || 'info');
        }
        else {
          sendToast('No results found.' || 'error');
        }
        callback(users, emptyTable);
      }
      catch (err) {
        const message = err.message || 'Something went wrong';
        const type = err.type || 'error';
        sendToast(message, type);
        callback([], false);
      }
    });

    socket.on('search_forUsers', async ({ searchText, toast }, callback) => {
      try {
        if (!searchText) {
          throw Object.assign(new Error('Error, missing search Text.'), { type: 'error' });
        }
        const users = await search_userList(user.id, searchText);
        if (users.length > 0) {
          sendToast(toast?.message, toast?.type || 'success');
        }
        else {
          sendToast('No results found.' || 'error');
        }
        callback(users, users.length > 0);
      }
      catch (err) {
        const message = err.message || 'Something went wrong';
        const type = err.type || 'error';
        sendToast(message, type);
        callback([], false);
      }
    });

    socket.on('scroll_joinChats', async ({ cursor, direction, limit = 3 }, callback) => {
      try {
        const total = await get_total_numb_of_chats();
        if (!total) { throw Object.assign(new Error('Error getting number of chats, Please refresh page.'), { type: 'error' }); }

        let results = [];
        if (direction === 'forward') {
          results = await get_joinable_chats({ direction, cursor, limit });
          if (results.length === 0) {
            results = await get_joinable_chats({ direction, limit }); // by defalt cursor is reset 
          }
        }
        else {
          results = await get_joinable_chats({ direction, cursor, limit });
          if (results.length === 0) {
            results = await get_joinable_chats({ direction, limit: total % limit === 0 ? limit : total % limit }); // by defalt cursor is reset 
          }
        }
        if (!results.length) { throw Object.assign(new Error('No chats found, Please refresh page.'), { type: 'error' }); }
        callback({
          results,
          firstCursor: { name: results[0]?.chat_name, id: results[0]?.chat_id },
          lastCursor: { name: results[results.length - 1]?.chat_name, id: results[results.length - 1]?.chat_id },
          direction
        });
      }
      catch (err) {
        const message = err.message || 'Something went wrong';
        const type = err.type || 'error';
        sendToast(message, type);
        callback({ results: [] });
      }
    });

    socket.on('refresh_chats', async ({ toast }, callback) => {
      try {
        const results = await setUp_joinChatsList(LIMIT);
        if (results.length > 0) { throw Object.assign(new Error('No chats found, Please refresh page.'), { type: 'error' }); }
        sendToast(toast?.message, toast?.type || 'info');
        callback(results);
      }
      catch (err) {
        const message = err.message || 'Something went wrong';
        const type = err.type || 'error';
        sendToast(message, type);
      }
    });

    socket.on('search_forJoinChats', async ({ searchText, toast }, callback) => {
      try {
        if (!searchText) { throw Object.assign(new Error('Error, missing search Text.'), { type: 'error' }); }
        let success = true;
        let chats = await get_joinable_chats({ searchText });
        if (chats.length > 0) {
          sendToast(toast?.message, toast?.type || 'success');
        }
        else {
          chats = await setUp_joinChatsList(LIMIT);
          success = false;
          sendToast('No search results found. Refreshing Chat list.' || 'error');
        }
        callback({ chats, success })
      }
      catch (err) {
        const message = err.message || 'Something went wrong';
        const type = err.type || 'error';
        sendToast(message, type);
        callback({ success: false, chats: await setUp_joinChatsList(LIMIT) })
      }
    });

    socket.on('get_messagePage', async ({ chat_id }, callback) => {
      try {
        if (!chat_id) { throw Object.assign(new Error('Error, missing credentials. Can\'t load the message list.'), { type: 'error' }); }
        const result = await load_messages(user.id, chat_id);
        callback(result)
      }
      catch (err) {
        console.error(err)
        const message = err.message || 'Error loading the message list.';
        sendToast(message, 'error');
        //callback({ success: false, chats: await setUp_joinChatsList(LIMIT) })
      }

    });
    socket.on('opened_chat', async (chat_id) => {
      try {
        if (!chat_id) { throw Object.assign(new Error('Error, missing credentials. Can\'t update the read message list'), { type: 'error' }); }
        const update_readMessages = `UPDATE read_messages SET new_message = 0 WHERE chat_id = ? AND user_id = ?`;
        await pool(update_readMessages, [chat_id, user.id]);
      }
      catch (err) {
        const message = err.message || 'Error updating the read message list.';
        sendToast(message, 'error');
      }
    });

    socket.on('submit_message', async ({ chat_id, message }) => {
      try {
        if (!chat_id || !message) {
          throw Object.assign(new Error('Error submitting message.'), { type: 'error' });
        }

        const new_message = await upload_message(user.id, chat_id, message);

        if (!new_message) {
          sendToast('Error loading new message.', 'error');
          return;
        }

        if (chat_ServerList[chat_id]) {

          chat_ServerList[chat_id].forEach(userSocketObj => {
            // Each object has one key: userId, and value: socket 
            // Extract the socket
            const socket = Object.values(userSocketObj)[0];
            if (socket && socket.connected) {
              socket.emit('new_message', new_message);
            }
            else {
              console.error('error sending message')
            }
          });
        }

      }
      catch (err) {
        console.error(err)
        const message = err.message || 'Error submitting message.';
        sendToast(message, 'error');
      }
    });

    socket.on('loadChat_info_page', async ({ chatId }, callback) => {
      try {
        if (!chatId) {
          throw Object.assign(new Error('Error, missing credentials. Can\'t load chat info.'), { type: 'error' });
        }
        let success = true;
        const results = await loadChat_info_page(chatId);
        if (!results.Chat_info.length) {
          success = false;
        }
        results.Chat_info.is_admin = false;
        if (results.Chat_info.admin_id === user.id) {
          results.Chat_info.is_admin = true;
        }
        console.log(results)
        callback({ results, success });
      }
      catch (err) {
        console.error(err)
        const message = err.message || 'Error loading chat info.';
        sendToast(message, 'error');
        callback({ results: [], success: false });
      }
    });








































    socket.on('req_to_join_chat', async (chatId) => {
      const sql = ` INSERT INTO req_to_join_chat (user_id, chat_id) 
      VALUES (?,?);
      `;
      await pool(sql, [user.id, chatId]);

      const find_AdminSQL = `SELECT 
      ca.user_id
      FROM chat_administrators ca
      WHERE ca.chat_id = ? AND ca.current_admin = TRUE;
      `;
      const admin_result = await pool(find_AdminSQL, [chatId]);
      const admin_id = admin_result?.[0]?.user_id;
      console.log(chat_ServerList, chat_ServerList[chatId]?.[admin_id]);

      // that chat is live bec if it was empty then the admin of that chat is not active
      if (admin_id && chat_ServerList[chatId]?.[admin_id]) {
        const applicant_InfoSQL = `SELECT 
        u.display_name AS user_display_name
        FROM users u
        WHERE id = ? AND ca.current_admin = TRUE;
        `;

        chat_ServerList[chatId][admin_id].emit('req_to_join_chat', {
          user_display_name: user.display_name,
          user_id: user.id,
          chat_id: chatId
        });
      } else {
        console.log('Admin not connected or chat not live.');
      }
    });







    ////////////////////
    //  IO Functions  //
    ////////////////////

    function sendToast(message, type = 'info') {
      if (message) {
        socket.emit('toast', {
          message,
          type
        });
      }
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      cleanUpUser(user.id);
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
        throw Object.assign(new Error('Error, missing valid ID'), { userMessage: 'Error, missing valid ID' });
      }
      res.render('messaging_layout', {
        title: 'Chats',
        // toastMessage: 'you made it',
        //  toastType: 'error',
        partials: {
          content: 'messaging_homePage'
        }
      });
    }
    else {
      res.redirect('/Chatters/auth/Sign_In');
    }

  } catch (err) {
    console.error(err.stack);
    const message = encodeURIComponent(err.userMessage || 'Error, Please sign in again.');
    req.session.destroy(() => res.redirect(`/Chatters?error=${message}`));
  }
});


router.use('/log_out', (req, res) => {
  const user = req.session.loggedIn;

  if (user && user.id) {
    cleanUpUser(user.id);

    for (const chatId in chat_ServerList) {
      chat_ServerList[chatId].forEach(entry => {
        if (entry[user.id]) {
          const socket = entry[user.id];
          socket.emit('force_logout', { message: 'You have been logged out.' });
          socket.disconnect(true);
        }
      });
    }
  }

  req.session.destroy(() => res.redirect('/Chatters'));
});


export { router as default, setupChatSockets };
