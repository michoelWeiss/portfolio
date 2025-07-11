const socket = io();
const toast = $('#toast');
const chat_list = $('#chat_list');
const message_Page = $('#message_Page');
const chat_Info = $('#chat_Info');
const message_Container = $('#message_Container');
const message_input = $('#message_input');
const submit_button = $('#submit_button');

const join_chats_LastButt = $('#join_chats_LastButt');
const join_chats_NextButt = $('#join_chats_NextButt');
const join_chats_input = $('#join_chats_input');
const join_chats_submit_button = $('#join_chats_submit_button');
const join_chats_refresh_button = $('#join_chats_refresh_button');

const user_list = $('#user_list');
const user_list_input = $('#user_list_input');
const user_list_submit_button = $('#user_list_submit_button');
const user_list_refresh_button = $('#user_list_refresh_button');

const scroll_chat_carousel = [
    { carousel: $('.prev .join-chats-inner-row'), firstCursor: null, lastCursor: null },
    { carousel: $('.showing .join-chats-inner-row'), firstCursor: null, lastCursor: null },
    { carousel: $('.next .join-chats-inner-row'), firstCursor: null, lastCursor: null }
];
let userInfo;
let chatList = {};
let scroll_Index = 1;
let currentSearchIndex = { first: null, last: null };
let returned_Search = false;
let returned_Search_join_chatsList = [];
let atBottom = false;
let displayingUserSearch = false;
let last_seen = { name: '', id: 0 };
let chatLIMIT = 3;

//////////////////
//    Events    //
//////////////////

submit_button.click(submit_message);

//handle the carasel and array
join_chats_submit_button.click(() => {
    if (join_chats_input.val() === '') {
        join_chats_LastButt.prop('disabled', false);
        join_chats_NextButt.prop('disabled', false);
        returned_Search_join_chatsList = [];
        returned_Search = false;
        currentSearchIndex = { first: null, last: null };
        socket.emit('refresh_chats', { toast: { message: 'Chat list has been refreshed.', type: 'warning' } }, resetCarousel);
        return;
    }
    socket.emit('search_forJoinChats', { searchText: join_chats_input.val(), toast: { message: `Found results for ${join_chats_input.val()}.`, type: 'success' } }, setUp_searchResults);

});
join_chats_input.on('input', () => {
    if (join_chats_input.val() === '') {
        join_chats_LastButt.prop('disabled', false);
        join_chats_NextButt.prop('disabled', false);
        returned_Search_join_chatsList = [];
        returned_Search = false;
        currentSearchIndex = { first: null, last: null };
        socket.emit('refresh_chats', { toast: { message: 'Chat list has been refreshed.', type: 'info' } }, resetCarousel);
    }
});
join_chats_refresh_button.click(() => {
    join_chats_LastButt.prop('disabled', false);
    join_chats_NextButt.prop('disabled', false);
    returned_Search_join_chatsList = [];
    returned_Search = false;
    currentSearchIndex = { first: null, last: null };
    join_chats_input.val('');
    socket.emit('refresh_chats', { toast: { message: 'Chat list has been refreshed.', type: 'info' } }, resetCarousel);
});

user_list_submit_button.click(() => {
    if (user_list_input.val() === '') {
        socket.emit('load_more_users', { emptyTable: true, refresh: true, toast: { message: 'Missing search word, User list has been refreshed.', type: 'warning' } }, loadUsers);
        displayingUserSearch = false;
        return;
    }
    socket.emit('search_forUsers', { searchText: user_list_input.val(), toast: { message: `Found results for ${user_list_input.val()}`, type: 'success' } }, loadUsers);
    displayingUserSearch = true;

});
user_list_input.on('input', () => {
    if (user_list_input.val() === '') {
        displayingUserSearch = false;
        socket.emit('load_more_users', { emptyTable: true, refresh: true, toast: { message: 'User list has been refreshed.', type: 'info' } }, loadUsers);
    }
});

user_list_refresh_button.click(() => {
    socket.emit('load_more_users', { emptyTable: true, refresh: true, toast: { message: 'User list has been refreshed.', type: 'info' } }, loadUsers);
    user_list_input.val('');
    displayingUserSearch = false;
});

user_list.on('scroll', function () {
    const $this = $(this);
    const scrollBottom = $this.scrollTop() + $this.innerHeight();
    const scrollHeight = $this[0].scrollHeight;

    const nearBottom = scrollBottom >= scrollHeight - 150;

    if (nearBottom && !atBottom && !displayingUserSearch) {
        atBottom = true;
        console.log('Loading more users...');
        socket.emit(
            'load_more_users',
            { last_display_name: last_seen.name, last_id: last_seen.id },
            loadUsers
        );
    }
    else if (!nearBottom) {
        atBottom = false;
    }
});

join_chats_NextButt.click(() => {
    scroll_Index++;
    if (scroll_Index > 2) {
        scroll_Index = 0;
    }
    const cursor = scroll_chat_carousel[scroll_Index].lastCursor;
    if (
        returned_Search &&
        returned_Search_join_chatsList?.length > 0 &&
        currentSearchIndex.first &&
        currentSearchIndex.last
    ) {
        let index = scroll_Index + 1 > 2 ? 0 : scroll_Index + 1;

        if (currentSearchIndex.last < returned_Search_join_chatsList.length) {
            let tempArray = [];
            const currentLast = currentSearchIndex.last;
            for (let i = currentLast; i < currentLast + chatLIMIT; i++) {
                if (returned_Search_join_chatsList[i]) {
                    tempArray.push(returned_Search_join_chatsList[i]);
                    currentSearchIndex.last++;
                }
                else { join_chats_NextButt.prop('disabled', true); }
            }
            currentSearchIndex.first += chatLIMIT;
            updateScroll_Cursor(
                { name: tempArray[0]?.chat_name, id: tempArray[0]?.chat_id },
                { name: tempArray[tempArray.length - 1]?.chat_name, id: tempArray[tempArray.length - 1]?.chat_id },
                scroll_chat_carousel[index]);
            add_join_chatBox(tempArray, scroll_chat_carousel[index].carousel);
        }
        else {
            join_chats_NextButt.prop('disabled', true);
        }
        if (currentSearchIndex.first - chatLIMIT > 0) {
            join_chats_LastButt.prop('disabled', false);
        }
    }
    else {
        socket.emit('scroll_joinChats', { cursor, direction: 'forward', limit: chatLIMIT }, new_scroll_chats);
    }
});
join_chats_LastButt.click(() => {
    scroll_Index--;
    if (scroll_Index < 0) {
        scroll_Index = 2;
    }

    const cursor = scroll_chat_carousel[scroll_Index].firstCursor;
    if (returned_Search &&
        returned_Search_join_chatsList?.length > 0 &&
        currentSearchIndex.first &&
        currentSearchIndex.last
    ) {
        let index = scroll_Index - 1 < 0 ? 2 : scroll_Index - 1;

        if (currentSearchIndex.first - chatLIMIT > 0) {
            join_chats_NextButt.prop('disabled', false);
            let tempArray = [];
            const currentFirst = currentSearchIndex.first;
            for (let i = currentFirst - chatLIMIT; i < currentFirst; i++) {
                if (returned_Search_join_chatsList[i - 1]) {
                    tempArray.push(returned_Search_join_chatsList[i - 1]);
                    currentSearchIndex.first--;
                    currentSearchIndex.last--;
                }
                else {
                    join_chats_LastButt.prop('disabled', true);
                }
            }
            updateScroll_Cursor(
                { name: tempArray[0]?.chat_name, id: tempArray[0]?.chat_id },
                { name: tempArray[tempArray.length - 1]?.chat_name, id: tempArray[tempArray.length - 1]?.chat_id },
                scroll_chat_carousel[index]);
            add_join_chatBox(tempArray, scroll_chat_carousel[index].carousel);
        }
        else {
            join_chats_LastButt.prop('disabled', true);
        }


    }
    else {
        socket.emit('scroll_joinChats', { cursor, direction: 'backward', limit: chatLIMIT }, new_scroll_chats);
    }
});




/////////////////
//  Functions  //
/////////////////

function resetCarousel({ next, prev, showing }) {
    if (showing && showing.chats) {
        updateScroll_Cursor(showing.firstCursor, showing.lastCursor, scroll_chat_carousel[scroll_Index]);
        add_join_chatBox(showing.chats, scroll_chat_carousel[scroll_Index].carousel);
    }
    if (next && next.chats) {
        const nextIndex = scroll_Index + 1 > 2 ? 0 : scroll_Index + 1;
        updateScroll_Cursor(next.firstCursor, next.lastCursor, scroll_chat_carousel[nextIndex]);
        add_join_chatBox(next.chats, scroll_chat_carousel[nextIndex].carousel);
    }
    if (prev && prev.chats) {
        const lastIndex = scroll_Index - 1 < 0 ? 2 : scroll_Index - 1;
        updateScroll_Cursor(prev.firstCursor, prev.lastCursor, scroll_chat_carousel[lastIndex]);
        add_join_chatBox(prev.chats, scroll_chat_carousel[lastIndex].carousel);
    }
}

function updateScroll_Cursor(firstCursor, lastCursor, scroll_Object) {
    Object.assign(scroll_Object, { firstCursor, lastCursor });
}

function add_join_chatBox(chatArray, container) {
    container.empty();
    chatArray.forEach(chat => {
        const chatBox = $(`<div class="join_chatBox"></div>`);
        const name = $(`<h4></h4>`).text(chat.chat_name);
        const members = $('<h6></h6>').text(`${chat.active_members} members`);
        chatBox.click(() => reqToJoinChat(chat.chat_id));
        chatBox.append(name);
        chatBox.append(members);
        container.append(chatBox);
    });
}

function reqToJoinChat(chatId) {  // need to handle req to join chat
    socket.emit('req_to_join_chat', chatId);
}

function setUp_chat_list(chats) {
    if (!chats.length) {
        const emptyState = $(`
    <div class="empty-chats-message">
      <p>You haven’t joined any chats yet.</p>
    </div>
  `);
        chat_list.append(emptyState);
    }
    else {
        chat_list.empty();
        chats.forEach(chat => {
            if (chat) {
                let current_chat;
                if (chat.new_messages) {  // handle new messages 
                    current_chat = $(`<div class="chat-container chat new_message"></div>`);
                }
                else {
                    current_chat = $(`<div class="chat-container chat"></div>`);
                }
                const chat_name = $(`<h2></h2>`).text(chat.chat_name);
                const message_container = $(`<div class="message"></div>`);
                const sender_name = $(`<h3></h3>`).text(chat.sender_display_name);
                const message = $(`<h4></h4>`).text(chat.message);
                const date = $(`<h6></h6>`).text(chat.date_sent);

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
}

function loadUsers(userList, clearTable = false) {
    if (clearTable) {
        user_list.empty();
        last_seen.id = 0;
        last_seen.name = '';
    }
    user_list.find('.empty-chats-message').remove();
    if (!userList.length && user_list.children().length === 0) {
        const emptyState = $(`
            <div class="empty-chats-message">
                <p>No Users found.</p>
            </div>
        `);
        user_list.append(emptyState);
        return;
    }

    userList.forEach(user => {
        if (!user) return;

        const current_user = $('<div class="user_container"></div>');
        const user_name = $('<h3></h3>').text(user.display_name);

        current_user.append(user_name);
        current_user.on('click', () => {
            console.log(user.user_id);
            // TODO: trigger open chat or send message
        });

        user_list.append(current_user);

        // Keep last_seen updated to be ready for pagination
        if (
            user.display_name > last_seen.name ||
            (user.display_name === last_seen.name && user.user_id > last_seen.id)
        ) {
            last_seen.id = user.user_id;
            last_seen.name = user.display_name;
        }
    });

}

function new_scroll_chats({ results, firstCursor, lastCursor, direction }) {
    if (results) {
        let index;
        if (direction === 'forward') {
            index = scroll_Index + 1 > 2 ? 0 : scroll_Index + 1;
        }
        else {
            index = scroll_Index - 1 < 0 ? 2 : scroll_Index - 1;
        }
        updateScroll_Cursor(firstCursor, lastCursor, scroll_chat_carousel[index]);
        add_join_chatBox(results, scroll_chat_carousel[index].carousel);
    }
}

function setUp_searchResults({ chats, success }) {
    if (!success && chats) {
        resetCarousel(chats);
        join_chats_LastButt.prop('disabled', false);
        returned_Search_join_chatsList = [];
        returned_Search = false;
        currentSearchIndex = { first: null, last: null };
        return;
    }

    if (chats.length > 0) {
        currentSearchIndex = { first: 1, last: 0 };
        returned_Search_join_chatsList = chats;
        join_chats_LastButt.prop('disabled', true);
        returned_Search = true;

        let index = scroll_Index;
        let tempArray = [];
        // max 2 carousels worth of iterations
        const iterations = returned_Search_join_chatsList.length <= chatLIMIT * 2 ? returned_Search_join_chatsList.length : chatLIMIT * 2;
        for (let i = 0; i < iterations; i++) {
            console.log(returned_Search_join_chatsList[i])
            tempArray.push(returned_Search_join_chatsList[i]);
            currentSearchIndex.last++;
            if (i === chatLIMIT - 1) {
                updateScroll_Cursor(
                    { name: tempArray[0]?.chat_name, id: tempArray[0]?.chat_id },
                    { name: tempArray[tempArray.length - 1]?.chat_name, id: tempArray[tempArray.length - 1]?.chat_id },
                    scroll_chat_carousel[index]
                );
                add_join_chatBox(tempArray, scroll_chat_carousel[index].carousel);
                tempArray = [];
                index = scroll_Index + 1 > 2 ? 0 : scroll_Index + 1;
            }
        }
        updateScroll_Cursor(
            { name: tempArray[0]?.chat_name, id: tempArray[0]?.chat_id },
            { name: tempArray[tempArray.length - 1]?.chat_name, id: tempArray[tempArray.length - 1]?.chat_id },
            scroll_chat_carousel[index]
        );
        add_join_chatBox(tempArray, scroll_chat_carousel[index].carousel);

    }
    else {
        // handle
    }

}

/////////////////
// Socket code //
/////////////////

socket.on('connection_successfull', ({ user, joinChatList, userList, LIMIT }) => {
    userInfo = user;
    chatLIMIT = LIMIT;
    console.log(user, joinChatList);  // remember to remove 
    if (joinChatList) {
        const { next, prev, showing } = joinChatList;
        resetCarousel({ next, prev, showing });
    }
    if (userList) {
        loadUsers(userList, false);
    }
    socket.emit('get_chatList', setUp_chat_list);
})

socket.on('toast', ({ message, type }) => {
    displayToast(message, type)
});
function displayToast(message, type) {
    toast.text(message);
    toast.removeClass('success error warning info').addClass(type || 'info');
    toast.stop(true, true).fadeIn(500).delay(5000).fadeOut(500);
}






















socket.on('new_message', (new_message) => {
    const messageBox = $(`<div class="message"></div>`);
    const sender_name = $(`<h5></h5>`).text(new_message.sender_name);
    const message = $(`<h4></h4>`).text(new_message.message);
    const date = $(`<h6></h6>`).text(new_message.date_sent);

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
        const chat_name = $(`<h2></h2>`).text(new_message.chat_name);
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


/*
if (direction === 'last') {
    join_chats_Container.prepend(chatBox);
}
else { join_chats_Container.append(chatBox); }
*/





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

            const chat_name = $(`<h1></h1>`).text(messagePage.chat.chat_name);
            const admin_name = $(`<h3 id="adminID-${messagePage.chat.admin_id}"></h3>`).text(messagePage.chat.admin_display_name);

            chat_Info.attr('data-chat-id', messagePage.chat.chat_id);
            chat_Info.append(chat_name);
            chat_Info.append(admin_name);

            if (messagePage.messages.length) {
                for (let i = messagePage.messages.length - 1; i >= 0; i--) {
                    const message = messagePage.messages[i];
                    const messageBox = $(`<div id="messageID-${message.message_id}" class='messageBox'></div>`);
                    const sender_name = $(`<h5></h5>`).text(message.sender_display_name);
                    const messageText = $(`<h4></h4>`).text(message.message);
                    const date = $(`<h6></h6>`).text(message.date_sent);

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




socket.on('force_logout', ({ message }) => {
    fetch('http://localhost/Chatters/chats/log_out', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: message || 'Session expired.' })
    }).then(() => {
        window.location.href = '/Chatters'; // fallback redirect
    });
});


$('#message_Page .close_btn').click(() => {
    message_Page.removeClass('active'); // Hide message page
    chat_Info.removeAttr('data-chat-id'); // Optional: clear context
});