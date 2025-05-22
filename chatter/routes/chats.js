import express from 'express';
var router = express.Router();

/* GET users listing. */
const load_chats_and_messages = async (req, id) => {
  try {
    const sql = `SELECT
  c.id AS chat_id,
  c.name AS chat_name,
  r.new_message AS new_messages,

  a.user_id AS admin_id,
  admin.display_name AS admin_display_name,

  m.id AS message_id,
  m.sender_id,
  sender.display_name AS sender_display_name,
  m.message,
  m.date_sent

FROM chat_members cm
JOIN chats c ON cm.chat_id = c.id
JOIN read_messages r ON c.id = r.chat_id AND r.user_id = cm.user_id

LEFT JOIN chat_messages m ON c.id = m.chat_id
LEFT JOIN users sender ON m.sender_id = sender.id

LEFT JOIN chat_administrators a 
  ON c.id = a.chat_id AND a.current_admin = TRUE
LEFT JOIN users admin ON a.user_id = admin.id

WHERE cm.user_id = ? AND cm.exit_date > CURRENT_DATE
ORDER BY c.id, m.date_sent;
`;
    const results = await req.pool(sql, [id]);
    return results;
  }
  catch (err) {
    throw err;
  }

};

router.get('/', async function (req, res, next) {
  try {
    if (req.session.loggedIn) {
      const user = req.session.loggedIn;
      if (!user.id) {
        throw new Error("missing valid ID")
      }
      const results = await load_chats_and_messages(req, user.id);
      let chats = [];
      if (results) {
        results.forEach(messageTemp => {
          if (messageTemp && messageTemp.chat_id) {
            const { chat_id, chat_name, new_messages, admin_id, admin_display_name, message_id, sender_id, sender_display_name, message, date_sent } = messageTemp;
            let existingChat = chats.find(c => c.chat_id === messageTemp.chat_id);
            if (existingChat) {
              existingChat.message.push({ message_id, sender_id, sender_display_name, message, date_sent });
            }
            else {
              chats.push({ chat_id, chat_name, new_messages, admin_id, admin_display_name, message: [{ message_id, sender_id, sender_display_name, message, date_sent }] });
            }

          }
        });
      }
       res.render('messaging_homePage', {
        title: 'Sign In',
        chats
      });
      res.send(chats);
      console.log(user)
    }
    else{
      res.redirect('/Chatters/auth/Sign_In');
    }
  }
  catch (err) {

  }

});

router.get('/log_out', (req, res, next) => {
  req.session.destroy(() => res.redirect('/Chatters'));
});
export default router
