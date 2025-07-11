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
    console.log(result)
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
    console.log('result ', result)
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
    console.log('limit ', limit, ' total ', total, ' ', total % limit === 0 ? limit : total % limit)
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
    const results = await pool(sql, [id]) || [];
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
      socket.disconnect();
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
            chat_ServerList[chat.chat_id] = {};
          }
          if (!chat_ServerList[chat.chat_id][user.id]) {
            chat_ServerList[chat.chat_id][user.id] = socket;
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
        console.log(toast?.message, toast?.type);
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
        console.log(toast?.message, toast?.type);
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
        console.log('chats ', chats)
        callback({ chats, success })
      }
      catch (err) {
        const message = err.message || 'Something went wrong';
        const type = err.type || 'error';
        sendToast(message, type);
        callback({ success: false, chats: await setUp_joinChatsList(LIMIT) })
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
        await pool(update_readMessages, [chat_id, user.id]);
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


router.post('/log_out', (req, res) => {
  const { error } = req.body || {};
  const redirectUrl = error
    ? `/Chatters?error=${encodeURIComponent(error)}`
    : '/Chatters';
  console.log(redirectUrl)
  req.session.destroy(() => res.redirect(redirectUrl));
});


export { router as default, setupChatSockets };
