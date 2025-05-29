const socket = io();
const chat_list = $('#chat_list');
const message_Page = $('#message_Page');
const chat_Info = $('#chat_Info');
const message_Container = $('#message_Container');
const message_input = $('#message_input');
const submit_button = $('#submit_button');

let userInfo;
let chatList = {};

submit_button.click(submit_message);

socket.on('connection_successfull', (user) => {
    userInfo = user;
    console.log(userInfo);
    socket.emit('get_chatList', setUp_chat_list);
})
function get_messagePage(chat_id) {
    if (chat_id) {
        socket.emit('get_messagePage', { chat_id }, load_Message_Container);
    }
}
function submit_message(event) {
    event.preventDefault();
    const message = message_input.val().trim();
    const chat_id = parseInt(chat_Info.attr('data-chat-id'));
    if (!message || isNaN(chat_id)) return;

    socket.emit('submit_message', { chat_id, message });
    message_input.val('');
}

socket.on('new_message', (new_message) => {
    const messageBox = $(`<div id="message"></div>`);
    const sender_name = $(`<h3>${new_message.sender_name}</h3>`);
    const message = $(`<h4>${new_message.message}</h4>`);
    const date = $(`<h6>${new_message.date_sent}</h6>`);

    messageBox.append(message);
    messageBox.append(sender_name);
    messageBox.append(date);

    let current_chat;
    if (chatList[new_message.chat_id]) {
        current_chat = chatList[new_message.chat_id];
        if (!current_chat.hasClass('new_message')) {
            current_chat.addClass('new_message');
        }
    }
    const messageDiv = current_chat.find('div#message');
    if (messageDiv.length) {
        messageDiv.remove();
    }
    else {
        current_chat = $(`<div id="chat_container" class="chat new_message"></div>`);
        const chat_name = $(`<h2>${new_message.chat_name}</h2>`);
        current_chat.append(chat_name);
        chatList[new_message.chat_id] = current_chat;
    }
    current_chat.append(messageBox);
    chat_list.prepend(current_chat);

    const currentChat_InChatPage = parseInt(chat_Info.attr('data-chat-id'));
    if (currentChat_InChatPage === new_message.chat_id) {
        current_chat.removeClass('new_message');
        message_Container.append(messageBox);
    }
})

function setUp_chat_list(chats) {
    chats.forEach(chat => {
        if (chat) {
            let current_chat;
            if (chat.new_messages) {
                current_chat = $(`<div id="chat-container" class="chat new_message"></div>`);
            }
            else {
                current_chat = $(`<div id="chat_container" class="chat"></div>`);
            }
            const chat_name = $(`<h2>${chat.chat_name}</h2>`);
            const message_container = $(`<div id="message"></div>`);
            const sender_name = $(`<h3>${chat.sender_display_name}</h3>`);
            const message = $(`<h4>${chat.message}</h4>`);
            const date = $(`<h6>${chat.date_sent}</h6>`);

            chatList[chat.chat_id] = current_chat;
            current_chat.click(() => get_messagePage(chat.chat_id));

            message_container.append(message);
            message_container.append(sender_name);
            message_container.append(date);

            current_chat.append(chat_name);
            current_chat.append(message_container);
            chat_list.append(current_chat);
        }
    });
}

function load_Message_Container(messagePage) {
    console.log(messagePage);

    if (messagePage) {
        const currentChatId = parseInt(chat_Info.attr('data-chat-id'));
        if (messagePage.chat.chat_id === currentChatId) {
            return;
        }
        else {
            chat_Info.empty();
            message_Container.empty();

            const chat_name = $(`<h1>${messagePage.chat.chat_name}</h1>`);
            const admin_name = $(`<h3 id="adminID-${messagePage.chat.admin_id}">${messagePage.chat.admin_display_name}</h3>`);

            chat_Info.attr('data-chat-id', messagePage.chat.chat_id);
            chat_Info.append(chat_name);
            chat_Info.append(admin_name);

            if (messagePage.messages.length) {
                for (let i = messagePage.messages.length - 1; i >= 0; i--) {
                    const message = messagePage.messages[i];
                    const messageBox = $(`<div id="messageID-${message.message_id}" class='messageBox'></div>`);
                    const sender_name = $(`<h5>${message.sender_display_name}</h5>`);
                    const messageText = $(`<h4>${message.message}</h4>`);
                    const date = $(`<h6>${message.date_sent}</h6>`);

                    messageBox.append(messageText);
                    messageBox.append(sender_name);
                    messageBox.append(date);
                    message_Container.append(messageBox);
                }
            }
            else {
                const messageBox = $(`<div class='messageBox'></div>`);
                const message = $(`<h4>No messages</h4>`);
                messageBox.append(message);
                message_Container.append(messageBox);
            }
        }

    }
}