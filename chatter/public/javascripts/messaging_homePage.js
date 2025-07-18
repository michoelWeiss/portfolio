const socket = io();
const toast = $('#toast');
const chat_list = $('#chat_list');
const message_Page = $('#message_Page');
const chat_Info = $('#chat_Info');
const message_Container = $('#message_Container');
const message_input = $('#message_input');
const submit_button = $('#submit_button');
const newMessage_Sound = $('#messageSound');
const chat_Info_btn = $('#chat_Info_btn');

const join_chats_LastButt = $('#join_chats_LastButt');
const join_chats_NextButt = $('#join_chats_NextButt');
const join_chats_input = $('#join_chats_input');
const join_chats_submit_button = $('#join_chats_submit_button');
const join_chats_refresh_button = $('#join_chats_refresh_button');

const user_list = $('#user_list');
const user_list_input = $('#user_list_input');
const user_list_submit_button = $('#user_list_submit_button');
const user_list_refresh_button = $('#user_list_refresh_button');

const chat_details = $('#chat_details');
const chat_details_chat_title = $('#chat_details .chat-title');
const chat_details_chat_description = $('#chat_details .chat-description');
const chat_details_chat_created = $('#chat_details .chat-created span');
const chat_details_admin_name = $('#chat_details .chat-admin span');
const chat_details_user_status = $('#chat_details .user-status span');
const chat_details_members_list = $('#chat_details .members-list');
const chat_details_leave_btn = $('#chat_details .leave-btn');

const accordion = $('#accordionFlushExample');
const adminEditName = $('#EditName');
const adminEditDescription = $('#EditDescription');
const adminChangeAdmin = $('#ChangeAdmin');
const adminRemoveMember = $('#RemoveMember');


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
let disableNextButton = false;

//////////////////
//    Events    //
//////////////////


submit_button.click(submit_message);
chat_Info_btn.click((e) => {
    e.preventDefault();
    const currentChatId = parseInt(chat_Info.attr('data-chat-id'));
    if (!currentChatId) {
        displayToast('Missing credentials: can\'t load chat info page.', 'error');
        return;
    }
    socket.emit('loadChat_info_page', { chatId: currentChatId }, loadChat_info_page)
});
$('#message_Page .close_btn').click(() => {
    closePage(message_Page);
    chat_Info.removeAttr('data-chat-id');
});
$('#chat_details_close_btn').click(() => closePage(chat_details))

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
            disableNextButton = false;
            let tempArray = [];
            const currentLast = currentSearchIndex.last;
            for (let i = currentLast; i < currentLast + chatLIMIT; i++) {
                if (returned_Search_join_chatsList[i]) {
                    tempArray.push(returned_Search_join_chatsList[i]);
                    currentSearchIndex.last++;
                }
                else {
                    disableNextButton = true;
                }
            }
            if (currentSearchIndex.last > chatLIMIT * 3) {
                currentSearchIndex.first += chatLIMIT;
            }
            updateScroll_Cursor(
                { name: tempArray[0]?.chat_name, id: tempArray[0]?.chat_id },
                { name: tempArray[tempArray.length - 1]?.chat_name, id: tempArray[tempArray.length - 1]?.chat_id },
                scroll_chat_carousel[index]);
            add_join_chatBox(tempArray, scroll_chat_carousel[index].carousel);

        }
        else if (disableNextButton) {
            currentSearchIndex.first += chatLIMIT;
            join_chats_NextButt.prop('disabled', true);
        }
        else {
            currentSearchIndex.first += chatLIMIT;
            join_chats_NextButt.prop('disabled', true);
        }
        if (currentSearchIndex.last > chatLIMIT * 2) {
            join_chats_LastButt.prop('disabled', false);
        }
        console.log(currentSearchIndex.first, currentSearchIndex.last)
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

        if (currentSearchIndex.last > chatLIMIT * 2) {
            if (currentSearchIndex.last - currentSearchIndex.first > chatLIMIT * 2) {
                currentSearchIndex.last = currentSearchIndex.last % chatLIMIT === 0 ? currentSearchIndex.last -= chatLIMIT : currentSearchIndex.last -= currentSearchIndex.last % chatLIMIT;
            }
            join_chats_NextButt.prop('disabled', false);
            let tempArray = [];
            const currentFirst = currentSearchIndex.first;
            for (let i = currentFirst - chatLIMIT; i < currentFirst; i++) {
                if (returned_Search_join_chatsList[i - 1]) {
                    tempArray.push(returned_Search_join_chatsList[i - 1]);
                    if (currentSearchIndex.first > 1) {
                        currentSearchIndex.first--;
                    }
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

        console.log(currentSearchIndex.first, currentSearchIndex.last)
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
            if (chat && chat.chat_id) {
                const chatContainer = $(`
                    <div class="chat-item ${chat.new_messages ? 'new-message' : ''}">
                        <div class="chat-header">
                            <h2 class="chat-name">${chat.chat_name}</h2>
                            <span class="chat-date">${chat.date_sent ? new Date(chat.date_sent).toLocaleString() : ''}</span>
                        </div>
                        <div class="chat-body">
                            ${chat.message_id
                        ? `
                                    <p class="sender-name">${chat.sender_display_name}</p>
                                    <p class="message-preview">${chat.message}</p>
                                `
                        : `<p class="no-messages">No messages have been sent yet.</p>`
                    }
                        </div>
                    </div>
                `);

                // Click handler
                chatContainer.click(() => get_messagePage(chat.chat_id));

                chatList[chat.chat_id] = chatContainer;
                chat_list.append(chatContainer);
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
        console.log(currentSearchIndex.first, currentSearchIndex.last)
    }
    else {
        // handle
    }
}

function get_messagePage(chat_id) {
    if (!chat_id) {
        displayToast('Missing credentials', 'error');
        return;
    }

    socket.emit('get_messagePage', { chat_id }, load_Message_Container);
    if (chatList[chat_id].hasClass('new-message')) {
        chatList[chat_id].removeClass('new-message');
    }
}

function load_Message_Container(messagePage) {
    if (!messagePage) {
        return;  // handle 
    }

    const currentChatId = parseInt(chat_Info.attr('data-chat-id'));

    if (messagePage.chat.chat_id === currentChatId) {
        closePage(message_Page);
        chat_Info.removeAttr('data-chat-id'); // Optional: clear context
        return;  // chat is open get it to close and clear 
    }

    chat_Info.empty();
    message_Container.empty();

    chat_Info.attr('data-chat-id', messagePage.chat.chat_id);

    const chatName = $(`<h1 class="chat-title"></h1>`).text(messagePage.chat.chat_name);
    const adminName = $(`
        <h3 class="chat-admin">
            Admin: <span id="adminID-${messagePage.chat.admin_id}">${messagePage.chat.admin_display_name}</span>
        </h3>
    `);

    chat_Info.append(chatName);
    chat_Info.append(adminName);

    if (messagePage.messages.length) {
        messagePage.messages.forEach(async msg => {
            await add_Message_to_Page(msg);
        });
    }
    else {
        const emptyMessage = $(`
            <div class="no-messages">No messages yet.</div>
        `);
        message_Container.append(emptyMessage);
    }

    message_Container.scrollTop(message_Container.prop("scrollHeight"));
    closePage(chat_details);
    openPage(message_Page);
    socket.emit('opened_chat', messagePage.chat.chat_id);
}

async function add_Message_to_Page(msg) {
    const localDate = new Date(msg.date_sent).toLocaleString([], {  // need to fix date its a big problem 
        dateStyle: 'short',
        timeStyle: 'short'
    });
    console.log(userInfo);
    const isOwnMessage = msg.sender_id === userInfo.id;
    const messageClass = isOwnMessage ? 'own-message' : 'other-message';
    const messageBox = $(`
        <div id="messageID-${msg.message_id}" 
             class="messageBox ${messageClass}" 
             data-sender-id="${msg.sender_id}">
            <div class="message-header">
                <span class="sender-name">${msg.sender_display_name}</span>
                <span class="message-date">${localDate}</span> 
            </div>
            <div class="message-text">${msg.message}</div>
        </div>
    `);

    message_Container.append(messageBox);
}

function displayToast(message, type) {
    toast.text(message);
    toast.removeClass('success error warning info').addClass(type || 'info');
    toast.stop(true, true).fadeIn(500).delay(5000).fadeOut(500);
}

function openPage(page) {
    page = $(page);
    page.addClass('active');
    if (!$('#main_Content').hasClass('shrunk')) {
        $('#main_Content').addClass('shrunk');
    }
}

function closePage(page) {
    page = $(page);
    page.removeClass('active');
    if (page.is('#message_Page') && $('#main_Content').hasClass('shrunk')) {
        $('#main_Content').removeClass('shrunk');
    }
}




function loadChat_info_page(chat) {
    let chatInfo_andUsers = chat.results;

    if (!chatInfo_andUsers || !chatInfo_andUsers.Chat_info) {
        console.error('Invalid data for chat info page.');
        displayToast("Invalid data for chat info page.", "error")
        return;
    }

    const chatInfo = chatInfo_andUsers.Chat_info;
    const users = chatInfo_andUsers.Chat_users || [];

    // Populate chat header info
    chat_details_chat_title.text(chatInfo.chat_name);
    chat_details_chat_description.text(chatInfo.chat_details || 'No description available');
    chat_details_chat_created.text(formatDate(chatInfo.chat_create_date));

    // Populate admin info
    chat_details_admin_name.text(chatInfo.admin_name || 'Unknown');

    // Populate current user status
    const status = chatInfo.is_admin ? 'Admin' : 'User';
    chat_details_user_status.text(status);

    fillChat_info_Users_page(users, chatInfo.admin_id, chatInfo.is_admin);


    if (chatInfo.is_admin) {
        accordion.show();
        adminEditName.on('click', () => handleEditName(chatInfo.chat_id));
        adminEditDescription.on('click', () => handleEditDescription(chatInfo.chat_id));
        adminChangeAdmin.on('click', () => handleChangeAdmin(users, chatInfo.admin_id, chatInfo.chat_id, chatInfo.is_admin));
        //  adminRemoveMember.on('click', handleRemoveMember);
    } else {
        accordion.hide();
        adminEditName.off('click');
        adminEditDescription.off('click');
        adminChangeAdmin.off('click');
        // adminRemoveMember.off('click', handleRemoveMember);
    }
    openPage(chat_details);
}

function handleChangeAdmin(users, admin_id, chat_id, is_admin) {
    if (!chat_id) {
        displayToast("Error, missing chat Id.", "error")
        return;
    }
    chat_details_members_list.empty();

    users.forEach(user => {
        const radioBtn = `
          <label class="list-group-item d-flex justify-content-between align-items-center">
            <input class="form-check-input me-1" type="radio" name="newAdmin" value="${user.user_id}">
            ${user.display_name}
            ${user.user_id === admin_id ? '<span class="badge bg-primary">Current Admin</span>' : ''}
          </label>
        `;
        chat_details_members_list.append(radioBtn);
    });
    const cancel = $('<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>');
    const confirm = $('<button type="button" class="btn btn-primary" id="confirmChangeAdmin">Change Admin</button>');
    chat_details_members_list.append(cancel);
    chat_details_members_list.append(confirm);

    confirm.on('click', () => {
        const selectedUserId = $('input[name="newAdmin"]:checked').val(); // Get value of checked radio button
        if (!selectedUserId) {
            displayToast("Please select a user to make admin.", "warning")
            return;
        }
        if (selectedUserId === admin_id) {
            displayToast("You are already the admin, Please select someone else.", "warning")
            return;
        }
        //socket.emit('change_admin', { chat_id, new_admin_id: selectedUserId });
        fillChat_info_Users_page(users, selectedUserId, false);
        confirm.off('click');
        cancel.off('click');
    });
    cancel.on('click', () => {
        fillChat_info_Users_page(users, admin_id, is_admin);
        confirm.off('click');
        cancel.off('click');
    });

}

function handleEditName(chatId) {
    if (!chatId) {
        displayToast('Missing chat Id: can\'t update chat name.', 'error');
        return;
    }
    const savedHTML = chat_details_chat_title.html();
    const text = chat_details_chat_title.text();

    // Replace title with form
    chat_details_chat_title.html(`
        <div id="editingName_Container">
        <input type="text" id="editNameInput" value="${text}" />
        <button id="saveNameBtn">Save</button>
        <button id="cancelNameBtn">Cancel</button>
        </div>
    `);

    // Add listeners for Save/Cancel
    $('#saveNameBtn').on('click', function () {
        const newName = $('#editNameInput').val().trim();
        if (newName) {
            const updatedHTML = savedHTML.replace(text, newName);
            chat_details_chat_title.html(updatedHTML);
            $('#saveNameBtn').off('click');
            $('#cancelNameBtn').off('click');

            // socket.emit('change_chat_name', { chatId, newName });
            console.log('Chat name updated:', newName);
        }
        else {
            displayToast('Chat name cannot be empty.', 'warning');
        }
    });

    $('#cancelNameBtn').on('click', function () {
        $('#saveNameBtn').off('click');
        $('#cancelNameBtn').off('click');
        // Restore original HTML
        chat_details_chat_title.html(savedHTML);
    });
}

function handleEditDescription(chatId) {
    if (!chatId) {
        displayToast('Missing chat Id: can\'t update chat description.', 'error');
        return;
    }
    const savedHTML = chat_details_chat_description.html();
    const text = chat_details_chat_description.text();

    // Replace title with form
    chat_details_chat_description.html(`
        <div id="editingName_Container">
        <input type="text" id="editDescriptionInput" value="${text}" />
        <button id="saveDescriptionBtn">Save</button>
        <button id="cancelDescriptionBtn">Cancel</button>
        </div>
    `);

    // Add listeners for Save/Cancel
    $('#saveDescriptionBtn').on('click', function () {
        const newDescription = $('#editDescriptionInput').val().trim();
        if (newDescription) {
            const updatedHTML = savedHTML.replace(text, newDescription);
            chat_details_chat_description.html(updatedHTML);
            $('#saveDescriptionBtn').off('click');
            $('#cancelDescriptionBtn').off('click');

            // socket.emit('change_chat_description', { chatId, newName });
            console.log('Chat description updated:', newDescription);
        }
        else {
            displayToast('Chat description cannot be empty.', 'warning');
        }
    });

    $('#cancelDescriptionBtn').on('click', function () {
        $('#saveDescriptionBtn').off('click');
        $('#cancelDescriptionBtn').off('click');
        // Restore original HTML
        chat_details_chat_description.html(savedHTML);
    });
}

function fillChat_info_Users_page(users, admin_id, is_admin) {
    chat_details_members_list.empty();
    if (!users.length) {
        const noUsers = $(`
            <li class="member-card">
                <span class="no-users">This chat has no users yet.</span>
            </li>
        `);
        chat_details_members_list.append(noUsers);
    }
    else {
        users.forEach(user => {
            const member_card = $(`
            <li class="member-card">
                <span class="member-name">${user.display_name}</span>
                <span class="member-role">${user.user_id === admin_id ? 'Admin' : 'User'}</span>
            </li>
        `);
            if (is_admin) {
                const deleteButton = $(`<button class="remove-btn">Remove</button>`);
                member_card.append(deleteButton);
            }
            chat_details_members_list.append(member_card);
        });
    }
}
// Helper function to format date nicely
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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
    displayToast(message, type);
});

socket.on('new_message', async (new_message) => {
    if (!new_message || !new_message.message || !new_message.sender_id || !chatList[new_message.chat_id]) {
        return;
    }

    const currentChat_InChatPage = parseInt(chat_Info.attr('data-chat-id'));
    const chatIsOpenInPage = currentChat_InChatPage === new_message.chat_id;

    let current_chat = chatList[new_message.chat_id];

    const noMessages = current_chat.find('.no-messages');
    if (noMessages.length) {
        noMessages.remove();
    }
    if (!current_chat.hasClass('new-message') && !chatIsOpenInPage) {
        current_chat.addClass('new-message');
    }

    const chat_date = current_chat.find('.chat-header').find('.chat-date');
    const sender_name = current_chat.find('.chat-body').find('.sender-name');
    const message_preview = current_chat.find('.chat-body').find('.message-preview');
    chat_date.text(new_message.date_sent ? new Date(new_message.date_sent).toLocaleString() : '');
    sender_name.text(new_message.sender_display_name);
    message_preview.text(new_message.message);

    chat_list.prepend(current_chat);

    if (messageSound && !chatIsOpenInPage) {
        messageSound.volume = 0.5;
        messageSound.play().catch(err => console.log('Audio play prevented by browser:', err));
    }

    if (chatIsOpenInPage) {
        await add_Message_to_Page(new_message);
        message_Container.scrollTop(message_Container.prop("scrollHeight"));
        socket.emit('opened_chat', new_message.chat_id);
    }
})
























socket.on('req_to_join_chat', (message) => console.log(message));


/*
if (direction === 'last') {
    join_chats_Container.prepend(chatBox);
}
else { join_chats_Container.append(chatBox); }
*/









function submit_message(event) {
    event.preventDefault();
    const message = message_input.val().trim();
    const chat_id = parseInt(chat_Info.attr('data-chat-id'));
    if (!message || isNaN(chat_id)) return;

    socket.emit('submit_message', { chat_id, message });
    message_input.val('');
}


socket.on('force_logout', ({ message }) => {
    alert(message || 'You have been logged out.');
    socket.io.opts.reconnection = false;
    socket.disconnect();
    fetch('/Chatters/chats/log_out', { method: 'POST' })
        .finally(() => {
            window.location.href = '/Chatters';
        });
});


