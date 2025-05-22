import express from 'express';
import testsPage from '../testInput.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mailer from '../mailer.js';
import dotenv from 'dotenv';
dotenv.config();
var router = express.Router();

const hash = (text, saltRounds = 10) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(text, saltRounds, (err, hashedPassword) => {
      if (err) {
        reject(err);
      } else {
        resolve(hashedPassword);
      }
    });
  });
};
const verifyHash = async (input, hashedPassword) => {
  try {
    const match = await bcrypt.compare(input, hashedPassword);
    if (match) {
      return true;
    }
    else {
      return false;
    }
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
};
const make_token = () => {
  return crypto.randomBytes(32).toString('hex');
};
const Sign_in = async (req, res, next) => {
  try {
    const searchParam = req.body.searchParam;
    const verifyParam = req.body.verifyParam;

    if (!searchParam || typeof searchParam !== "object" || Object.keys(searchParam).length !== 1 ||
      !verifyParam || typeof verifyParam !== "object" || Object.keys(verifyParam).length !== 1) {
      throw Object.assign(new Error('Invalid Params'), { statusCode: 400 });
    }
    const [[searchKey, searchValue]] = Object.entries(searchParam);
    const [[verifyKey, verifyValue]] = Object.entries(verifyParam);

    if (searchKey && searchValue && verifyKey && verifyValue) {
      const sql = `SELECT id, username, display_name, email, email_verified, ${verifyKey} FROM users WHERE ${searchKey} = ? AND exit_date > CURRENT_DATE`;
      const results = await req.pool(sql, [searchValue]);
      if (!results.length) {
        throw Object.assign(new Error('Could not find a match to this Username'), { statusCode: 404 });
      }
      const user = results[0];
      if (verifyHash(verifyValue, user[verifyKey])) {
        user[verifyKey] = '';
      }
      else {
        throw Object.assign(new Error('Verification key is incorrect'), { statusCode: 401 });
      }

      if (user.email_verified !== 1) {
        req.session.email = {
          id: user.id,
          address: user.email
        };
        return res.redirect(307, '/Chatters/auth/sendVerificationLink');
      }
      req.session.loggedIn = user;
    }
    next();
  }
  catch (err) {
    console.error(err.stack);
    const status = err.statusCode || 400;
    res.status(status).send(err.message);
    return res.redirect('/Chatters/auth/Sign_In');
  }
};
const log_in = (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect('/Chatters/chats');
    //   res.render('loginLayout', {
    //    title: 'Logged In',
    //    display_backLink: false,
    //    partials: {
    //      content: 'logged_In'
    //     }
    //   });
  }
  else {
    return res.redirect('/Chatters/auth/Sign_In');
  }
};
const handle_tokens = async (req, res, next) => {
  const { id, token } = req.email;
  if (id && token) {
    try {
      const sql = 'DELETE FROM tokens WHERE id = ?';
      const results = await req.pool(sql, [id]);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      const expiresAtFormatted = expiresAt.toISOString();
      const tokenSQL = 'INSERT INTO tokens (id, verification_token, token_expires_at) VALUES (?, ?, ?)';
      const tokenInsert = await req.pool(tokenSQL, [id, token, expiresAtFormatted]);
      if (!tokenInsert.affectedRows)
        throw new Error('Error making verification token');
      next();
    }
    catch (err) {
      res.status(400).send(err.message);
      return res.redirect('/Chatters/auth/Sign_In');
    }
  }
};
const send_email = async (req, res, next) => {
  const { id, token, address, subject, html, content, title } = req.email;
  if (!id || !token || !address || !subject || !html || !content || !title) {
    return res.status(500).send("Error sending Email");
  }
  try {
    const emailMessage = {
      from: 'chatters612@gmail.com',//process.env.EMAIL_USER,
      to: address,
      subject,
      html
    };
    const send = await mailer.sendMail(emailMessage);
    console.log('Email sent:', send.response);
    res.render('layout', {
      title,
      partials: {
        content
      }
    });

  }
  catch (err) {
    console.error('Error sending email:', err.message);
    res.status(400).send(err.message);
    return res.redirect('/Chatters/auth/Sign_In');
  }
};
//import nodemailer from 'nodemailer';
/* GET home page. */

router.route('/Sign_Up')
  .get((req, res, next) => {
    res.render('layout', {
      title: 'Sign Up',
      display_backLink: false,
      partials: {
        content: 'sign_up'
      }
    });
  })
  .post(async (req, res, next) => {
    try {
      console.log(process.env.SQL_HOST, process.env.SQL_USER, process.env.SQL_PASSWORD, process.env.SQL_DATABASE);
      const tests = testsPage();
      let { username, displayName, password, passwordConfirm, email, securityQ } = req.body;
      let testUsername = tests.testLength(username) && tests.hasUpper(username) && tests.hasLower(username) && tests.hasNoSpaces(username);
      let testDisplayName = tests.testLength(displayName) && tests.hasUpper(displayName) && tests.hasLower(displayName);
      let testPassword = tests.testLength(password, 8) && tests.hasUpper(password) && tests.hasLower(password) && tests.hasNoSpaces(password) && tests.hasNumber(password);
      let testEmail = tests.testLength(email, 5, 320) && tests.isEmail(email);
      let testSecurityQ = tests.hasUpper(securityQ) || tests.hasLower(securityQ);
      let compairPasswords = passwordConfirm && passwordConfirm === password;

      if (!testUsername || !testDisplayName || !testPassword || !testEmail || !testSecurityQ || !compairPasswords) {
        throw Object.assign(new Error('Invalid input data'), { statusCode: 400 });
      }

      securityQ = securityQ.replace(/\s+/g, '');

      password = await hash(password).catch((err) => {
        throw Object.assign(new Error('Error Encrypting Password'), { statusCode: 500 });
      });

      securityQ = await hash(securityQ).catch((err) => {
        throw Object.assign(new Error('Error Encrypting Security Question'), { statusCode: 500 });
      });

      req.sanitizedData = { username, displayName, password, email, securityQ };
      next();
    }
    catch (err) {
      next(err);
    }
  },
    async (req, res, next) => {
      try {
        const { username, email } = req.sanitizedData;
        const sql = 'SELECT username, email FROM users WHERE (email = ? AND exit_date > CURRENT_DATE) OR (username = ? AND exit_date > CURRENT_DATE)';
        const results = await req.pool(sql, [email, username]);
        if (results.length) {
          const message = results[0].email === email ?
            `${email} is already in use, please select a new Email, if this is your Account click Sign In.` : `${username} is already in use, please select a new UserName`;
          throw Object.assign(new Error(message), { statusCode: 409 });
        }
        next();
      }
      catch (err) {
        next(err);
      }
    },
    async (req, res, next) => {
      try {
        const { username, displayName, password, email, securityQ } = req.sanitizedData;
        const sql = 'INSERT INTO users (username, display_name, password, email, security_question, join_date, exit_date, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const result = await req.pool(sql, [username, displayName, password, email, securityQ, new Date(), new Date('9999-12-31'), 0]);
        if (!result.affectedRows) {
          throw Object.assign(new Error('There was an error submitting your data, please try again.'), { statusCode: 500 });
        }
        return res.redirect(307, '/Chatters/auth/Sign_In');  // 307 will keep it as a post
      }
      catch (err) {
        next(err);
      }
    },
    function errorHandler(err, req, res, next) {
      console.error(err.stack);
      const status = err.statusCode || 400;
      res.status(status).send(err.message);
      return res.redirect('/Chatters/auth/Sign_Up');
    });

router.route('/Sign_In')
  .get((req, res, next) => {
    if (req.session.loggedIn) {
      next();
    }
    else {
      res.render('layout', {
        title: 'Sign In',
        display_backLink: false,
        partials: {
          content: 'sign_in'
        }
      });
    }
  },
    log_in)
  .post(async (req, res, next) => {

    const { username, password } = req.body;
    try {
      if (!username || !password) {
        throw new Error('Please Insert Username Or Password');
      }
      req.body.searchParam = { 'username': username };
      req.body.verifyParam = { 'password': password };

      next();
    }
    catch (err) {
      console.error(err.stack);
      res.status(400).send(err.message);
      return res.redirect('/Chatters/auth/Sign_In');
    }
  },
    Sign_in,
    log_in
  );

router.post('/sendVerificationLink', async (req, res, next) => {
  if (!req.session.email) {
    return res.redirect('/Chatters/auth/Sign_In');
  }
  const { id, address } = req.session.email;
  const token = make_token();
  if (id && address && token) {
    req.email = { id, address, token };
    next();
  }
},
  handle_tokens,
  (req, res, next) => {
    const { id, token } = req.email;
    req.email.subject = 'Verify Email Address';
    req.email.content = 'sendLink';
    req.email.title = 'Send Link';
    req.email.html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hello,</h2>
          <p>Please click the link below to verify your email address:</p>
          <a href="https://michoelweiss.com/Chatters/auth/verify-email?token=${token}&id=${id}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 14px; border: none; cursor: pointer; transition: background-color 0.3s ease;">
             Verify Email
          </a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Thank you,<br>The Chatters Team</p>
        </div>
      `;
    next();
  },
  send_email
);

router.get('/verify-email', async (req, res, next) => {
  const { token, id } = req.query;
  try {
    if (!token || !id)
      throw new Error('Invalid Credentials')
    const sql = `SELECT id FROM tokens WHERE id = ? AND verification_token = ? AND token_expires_at > CURRENT_TIMESTAMP`;
    const results = await req.pool(sql, [id, token]);
    if (results.length > 0) {
      // Token is valid, proceed with updating the user's email_verified
      console.log(results)
      const updateSQL = `UPDATE users SET email_verified = 1 WHERE id = ? AND exit_date > CURRENT_DATE`
      await req.pool(updateSQL, [id]);
      // Delete the token from the tokens table
      const deleteSQL = `DELETE FROM tokens WHERE id = ? AND verification_token = ?`
      await req.pool(deleteSQL, [id, token]);
      res.end();
    }
    else {
      throw Object.assign(new Error('This token could not be found'), { statusCode: 404 });
    }
  }
  catch (err) {
    next(err)
  }
},
  (err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 400;
    res.status(status).send(err.message);
    return res.redirect('/Chatters/auth/Sign_In');
  });

router.route('/Forgot_Username')
  .get((req, res, next) => {
    if (req.session.loggedIn) {
      next();
    }
    else {
      res.render('layout', {
        title: 'Forgot Username Sign In',
        display_backLink: true,
        partials: {
          content: 'forgot_username'
        }
      });
    }
  },
    log_in
  )
  .post((req, res, next) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        throw new Error('Please insert valid search params');
      }
      req.body.searchParam = { 'email': email };
      req.body.verifyParam = { 'password': password };

      next();
    }
    catch (err) {
      console.error(err.stack);
      res.status(400).send(err.message);
      return res.redirect('/Chatters/auth/Forgot_Username');
    }
  },
    Sign_in,
    log_in
  );
router.route('/Forgot_Password')
  .get((req, res, next) => {
    if (req.session.loggedIn) {
      next();
    }
    else {
      res.render('layout', {
        title: 'Forgot Password Sign In',
        display_backLink: true,
        partials: {
          content: 'forgot_password'
        }
      });
    }
  },
    log_in
  )
  .post(async (req, res, next) => {
    const { email, username } = req.body;
    try {
      if (!email || !username) {
        throw new Error('Please insert valid search params');
      }
      const sql = `SELECT id FROM users WHERE email = ? AND username = ? AND exit_date > CURRENT_DATE`;
      const results = await req.pool(sql, [email, username]);
      if (!results.length) {
        throw new Error('Could not find a match');
      }
      req.email.id = results[0].id;
      req.email.address = email;
      req.email.token = make_token();
      next();
    }
    catch (err) {
      return res.redirect('/Chatters/auth/Forgot_Password');
    }
  },
    handle_tokens,
    (req, res, next) => {
      const { id, token } = req.email;
      req.email.subject = 'Update Password';
      req.email.content = 'sendLink';
      req.email.title = 'Send Link';
      req.email.html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hello,</h2>
          <p>Please click the link below to update your password:</p>
          <a href="https://michoelweiss.com/Chatters/auth/update-password?token=${token}&id=${id}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 14px; border: none; cursor: pointer; transition: background-color 0.3s ease;">
             Update Password
          </a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Thank you,<br>The Chatters Team</p>
        </div>
      `;
      next();
    },
    send_email
  );

router.route('/Forgot_User_and_Password')
  .get((req, res, next) => {
    if (req.session.loggedIn) {
      next();
    }
    else {
      res.render('layout', {
        title: 'Forgot Username and Password Sign In',
        display_backLink: true,
        partials: {
          content: 'forgot_username_and_password'
        }
      });
    }
  },
    log_in
  )
  .post((req, res, next) => {
    const { email, securityQ } = req.body;
    try {
      if (!email || !securityQ) {
        throw new Error('Please insert valid search params');
      }
      req.body.searchParam = { 'email': email };
      req.body.verifyParam = { 'securityQ': securityQ };

      next();
    }
    catch (err) {
      console.error(err.stack);
      res.status(400).send(err.message);
      return res.redirect('/Chatters/auth/Forgot_User_and_Password');
    }
  },
    Sign_in,
    log_in
  );
router.route('/update-password')
  .get(async (req, res, next) => {
    const { token, id } = req.query;
    try {
      if (!token || !id)
        throw new Error('Invalid Credentials')

      const sql = `SELECT id FROM tokens WHERE id = ? AND verification_token = ? AND token_expires_at > CURRENT_TIMESTAMP`;
      const results = await req.pool(sql, [id, token]);

      if (results.length > 0) {
        res.render('layout', {
          title: 'New Password',
          display_backLink: false,
          partials: {
            content: 'new_password'
          },
          token,
          id
        });
      }
      else {
        throw Object.assign(new Error('This token could not be found'), { statusCode: 404 });
      }
    }
    catch (err) {
      next(err)
    }
  },
    (err, req, res, next) => {
      console.error(err.stack);
      const status = err.statusCode || 400;
      res.status(status).send(err.message);
      return res.redirect('/Chatters/auth/Sign_In');
    })
  .post(async (req, res, next) => {
    const { password, passwordConfirm, token, id } = req.body;
    try {
      if (!token || !id)
        throw new Error('Invalid Credentials')

      const sql = `SELECT id FROM tokens WHERE id = ? AND verification_token = ? AND token_expires_at > CURRENT_TIMESTAMP`;
      const results = await req.pool(sql, [id, token]);

      if (results.length > 0) {
        if (password !== passwordConfirm) {
          res.render('layout', {
            title: 'New Password',
            display_backLink: false,
            partials: {
              content: 'new_password'
            },
            token,
            id
          });
        }
        password = await hash(password).catch((err) => {
          throw Object.assign(new Error('Error Encrypting Password'), { statusCode: 500 });
        });

        const updateSQL = `UPDATE users SET password = ? WHERE id = ? AND exit_date > CURRENT_DATE`;
        await req.pool(updateSQL, [password, id]);
        const deleteSQL = `DELETE FROM tokens WHERE id = ? AND verification_token = ?`;
        await req.pool(deleteSQL, [id, token]);
        return res.redirect('/Chatters/auth/Sign_In');
      }
      else {
        throw Object.assign(new Error('This token could not be found'), { statusCode: 404 });
      }
    }
    catch (err) {
      console.error(err.stack);
      const status = err.statusCode || 400;
      res.status(status).send(err.message);
      return res.redirect('/Chatters/auth/Forgot_Password');
    }
  });


export default router
