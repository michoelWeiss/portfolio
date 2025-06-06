const socket = io();
const chat_list = $('#chat_list');
const message_Page = $('#message_Page');
const chat_Info = $('#chat_Info');
const message_Container = $('#message_Container');
const message_input = $('#message_input');
const submit_button = $('#submit_button');

const join_chats_LastButt = $('#join_chats_LastButt');
const join_chats_NextButtut = $('#join_chats_NextButt');
const join_chats_input = $('#join_chats_input');
const join_chats_submit_button = $('#join_chats_submit_button');

const scroll_chat_carousel = [{ carousel: $('.prev'), first: null, last: null }, { carousel: $('.showing'), first: null, last: null }, { carousel: $('.next'), first: null, last: null }]
let userInfo;
let chatList = {};
let scroll_Index = 1;

submit_button.click(submit_message);

join_chats_NextButtut.click(() => {
    scroll_Index++;
    if (scroll_Index > 2) {
        scroll_Index = 0;
    }
    const offset = scroll_chat_carousel[scroll_Index].last;
    socket.emit('scroll_joinChats', { offset, direction: 'next' });
});
join_chats_LastButt.click(() => {
    scroll_Index--;
    if (scroll_Index < 0) {
        scroll_Index = 2;
    }
    console.log(scroll_chat_carousel[scroll_Index].first)
    const offset = scroll_chat_carousel[scroll_Index].first - 4;  // 3 is the amount im scrolling and 1 because the offset is exclusive
    socket.emit('scroll_joinChats', { offset, direction: 'last' });
});

socket.on('new_scroll_chats', ({ results, first, last, direction }) => {
    if (results) {
        let index;
        if(direction === 'next'){
            index = scroll_Index + 1 > 2 ? 0: scroll_Index + 1;
        }
        else{
            index = scroll_Index - 1 < 0 ? 2: scroll_Index - 1;
        }
        scroll_chat_carousel[index].carousel.empty();
        updateScroll_First_Last(first, last, scroll_chat_carousel[index]);
        add_join_chatBox(results, scroll_chat_carousel[index].carousel);
    }
})

socket.on('connection_successfull', ({ user, joinChatList }) => {
    userInfo = user;
    console.log(joinChatList);
    if (joinChatList) {
        const { next, prev, showing } = joinChatList;
        updateScroll_First_Last(showing.first, showing.last, scroll_chat_carousel[1]);
        updateScroll_First_Last(next.first, next.last, scroll_chat_carousel[2]);
        updateScroll_First_Last(prev.first, prev.last, scroll_chat_carousel[0]);
        console.log(scroll_chat_carousel);
        add_join_chatBox(showing.chats, scroll_chat_carousel[1].carousel);
        add_join_chatBox(next.chats, scroll_chat_carousel[2].carousel);
        add_join_chatBox(prev.chats, scroll_chat_carousel[0].carousel);
    }
    socket.emit('get_chatList', setUp_chat_list);
})

socket.on('new_message', (new_message) => {
    const messageBox = $(`<div class="message"></div>`);
    const sender_name = $(`<h5>${new_message.sender_name}</h5>`);
    const message = $(`<h4>${new_message.message}</h4>`);
    const date = $(`<h6>${new_message.date_sent}</h6>`);

    messageBox.append(message);
    messageBox.append(sender_name);
    messageBox.append(date);

    let current_chat;
    if (chatList[new_message.chat_id]) {
        current_chat = $(chatList[new_message.chat_id]);
        if (!current_chat.hasClass('new_message')) {
            current_chat.addClass('new_message');
        }
        const messageDiv = current_chat.find('div.message');
        if (messageDiv.length) {
            messageDiv.remove();
        }
    }
    else {
        current_chat = $(`<div id="chat_container" class="chat new_message"></div>`);
        const chat_name = $(`<h2>${new_message.chat_name}</h2>`);
        current_chat.append(chat_name);
        chatList[new_message.chat_id] = current_chat;
    }
    console.log(current_chat, messageBox);
    current_chat.append(messageBox);
    chat_list.prepend(current_chat);

    const currentChat_InChatPage = parseInt(chat_Info.attr('data-chat-id'));
    if (currentChat_InChatPage === new_message.chat_id) {
        current_chat.removeClass('new_message');
        socket.emit('opened_chat', new_message.chat_id);
        message_Container.append(messageBox.clone());
    }
})


socket.on('req_to_join_chat', (message) => console.log(message));

function add_join_chatBox(chatArray, container, direction) {

    chatArray.forEach(chat => {
        const chatBox = $(`<div class="join_chatBox"></div>`);
        const name = $(`<h4>${chat.chat_name}</h4>`);
        const members = $(`<h6>${chat.active_members} members</h6>`);
        chatBox.click(() => reqToJoinChat(chat.chat_id));
        chatBox.append(name);
        chatBox.append(members);
        container.append(chatBox)
    });
    /*
    if (direction === 'last') {
        join_chats_Container.prepend(chatBox);
    }
    else { join_chats_Container.append(chatBox); }
    */
}

function reqToJoinChat(chatId) {
    socket.emit('req_to_join_chat', chatId);
}
function get_messagePage(chat_id) {
    if (chat_id) {
        socket.emit('get_messagePage', { chat_id }, load_Message_Container);
        socket.emit('opened_chat', chat_id);
        if (chatList[chat_id].hasClass('new_message')) {
            chatList[chat_id].removeClass('new_message');
        }
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
            const message_container = $(`<div class="message"></div>`);
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
                message_Page.addClass('active');
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

function updateScroll_First_Last(first, last, scroll_Object){
    Object.assign(scroll_Object, { first, last });
}



$('#message_Page .close_btn').click(() => {
    message_Page.removeClass('active'); // Hide message page
    chat_Info.removeAttr('data-chat-id'); // Optional: clear context
});