(function () {
    'use strict';

    const bloggerBody = document.createElement('div');
    bloggerBody.setAttribute('id', 'bloggerBody');

    const postAndCommentsBody = document.createElement('div');
    postAndCommentsBody.setAttribute('id', 'postAndCommentsBody');

    async function fetchBloggers() {
        try {
            const temp = await fetch('https://jsonplaceholder.typicode.com/users');
            if (!temp.ok) {
                throw new Error(`${temp.status} - ${temp.statusText}`);
            }
            const users = await temp.json();
            return users;
        }
        catch (e) {
            console.error(e);
        }
    }
    async function createBloggers() {
        const users = await fetchBloggers();
        console.log(users);
        if (users) {
            clearPosts();
            document.body.appendChild(bloggerBody);
            makeBloggerHeader();
            users.forEach(user => newBlogger(user));
        }
    }
    function makeBloggerHeader() {

        const headerContainer = document.createElement('div');
        headerContainer.classList.add('headerContainer');

        const header = document.createElement('div');
        header.classList.add('header');
        header.textContent = 'Blogger Hub';

        headerContainer.appendChild(header);
        bloggerBody.appendChild(headerContainer);
    }

    function newBlogger(user) {

        if (user) {
            const border = document.createElement('div');
            border.classList.add('border');

            const maincontainer = document.createElement('div');
            maincontainer.classList.add('maincontainer');

            const thecard = document.createElement('div');
            thecard.classList.add('thecard');


            const front = document.createElement('div');
            front.classList.add('front');

            const back = document.createElement('div');
            back.classList.add('back');

            const name = document.createElement('h3');
            name.classList.add('name');
            name.textContent = `Hi, my name is ${user.name}`;

            const work = document.createElement('h4');
            work.classList.add('work');

            const companyName = document.createElement('span');
            //     companyName.classList.add('bold');
            companyName.textContent = user.company.name;

            const companyJob = document.createElement('span');
            //      companyJob.classList.add('bold');
            companyJob.textContent = user.company.bs;

            work.appendChild(document.createTextNode('I work for '));
            work.appendChild(companyName);

            work.appendChild(document.createTextNode(' and my job is to '));
            work.appendChild(document.createElement('br'));
            work.appendChild(companyJob);

            const bioContainer = document.createElement('div');
            bioContainer.classList.add('bioContainer');

            const bio = document.createElement('p');
            bio.classList.add('bio');
            bio.textContent = 'I love sharing ideas and stories. Check out my blog and connect with me!';

            const webText = document.createElement('p');
            webText.classList.add('webText');
            webText.textContent = 'Check out my Blog: ';

            const webTextContainer = document.createElement('div');
            webTextContainer.classList.add('webTextContainer');
            webTextContainer.addEventListener('click', () => {
                event.preventDefault();
                createPosts(user);
            });

            const weblink = document.createElement('a');
            weblink.classList.add('websiteLink');
            weblink.textContent = user.website;


            webText.appendChild(weblink);
            webTextContainer.append(webText);
            front.appendChild(name);
            front.appendChild(work);
            bioContainer.appendChild(bio);
            back.appendChild(bioContainer);
            back.appendChild(webTextContainer);

            thecard.appendChild(front);
            thecard.appendChild(back);
            border.appendChild(thecard);
            maincontainer.appendChild(border);
            bloggerBody.appendChild(maincontainer);
        }

    }


    function clearBloggers() {
        Array.from(bloggerBody.children).forEach(child => child.remove());
        bloggerBody.remove();
    }
    function clearPosts() {
        Array.from(postAndCommentsBody.children).forEach(child => child.remove());
        postAndCommentsBody.remove();
    }
    async function fetchPosts(id) {
        try {
            const temp = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${id}`);
            if (!temp.ok) {
                throw new Error(`${temp.status} - ${temp.statusText}`);
            }
            const posts = await temp.json();
            return posts;
        }
        catch (e) {
            console.error(e);
        }
    }

    async function createPosts(blogger) {
        const id = blogger.id;
        const posts = await fetchPosts(id);
        if (posts) {
            clearBloggers();
            document.body.appendChild(postAndCommentsBody);
            makePostsHeader(blogger);
            posts.forEach(post => newPost(post));
        }
        console.log(posts);
    }
    function newPost(post) {

        const postBody = document.createElement('div');
        postBody.classList.add('postbody');

        const postTitle = document.createElement('div');
        postTitle.classList.add('postTitle');
        postTitle.textContent = post.title;

        const postContent = document.createElement('div');
        postContent.classList.add('postContent');
        postContent.textContent = post.body;

        const commentButton = document.createElement('button');
        commentButton.classList.add('commentButt');
        commentButton.textContent = 'Show Comments';
        commentButton.addEventListener('click', () => handleComments(post.id, postBody));

        const commentContainer = document.createElement('div');
        commentContainer.classList.add('fullcommentContainor');

        postBody.appendChild(postTitle);
        postBody.appendChild(postContent);
        postBody.appendChild(commentButton);
        postBody.appendChild(commentContainer);
        postAndCommentsBody.appendChild(postBody);
    }

    function makePostsHeader(blogger) {
        const headerContainer = document.createElement('div');
        headerContainer.classList.add('headerContainer');

        const header = document.createElement('div');
        header.classList.add('header');
        header.textContent = blogger.name;

        const navLink = document.createElement('div');
        navLink.classList.add('navLink');
        navLink.textContent = 'Blogger List';
        navLink.addEventListener('click', createBloggers)

        headerContainer.appendChild(navLink);
        headerContainer.appendChild(header);
        postAndCommentsBody.appendChild(headerContainer);
    }
    async function fetchComments(id) {
        try {
            const temp = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${id}`);
            if (!temp.ok) {
                throw new Error(`${temp.status} - ${temp.statusText}`);
            }
            const comments = await temp.json();
            return comments;
        }
        catch (e) {
            console.error(e);
        }
    }
    async function handleComments(id, postbody) {

        const fullcommentContainor = postbody.querySelector('.fullcommentContainor');
        const commentButt = postbody.querySelector('.commentButt');
        commentButt.disabled = true;
        if (commentButt.textContent === 'Show Comments') {
            const comments = await fetchComments(id);
            if (comments) {
                const commentContainor = document.createElement('div');
                commentContainor.classList.add('commentContainor');
                fullcommentContainor.appendChild(commentContainor);

                console.log(comments);
                comments.forEach(comment => newComment(comment, commentContainor, false));
                addInput(fullcommentContainor);
                fullcommentContainor.style.maxHeight = `${commentContainor.scrollHeight}px`;
                commentButt.textContent = 'Remove Comments';
            }
        }
        else {
            fullcommentContainor.style.maxHeight = '0';
            fullcommentContainor.addEventListener('transitionend', () => {
                removeComents(fullcommentContainor);
            }, { once: true });
            commentButt.textContent = 'Show Comments';
        }

        fullcommentContainor.addEventListener('transitionend', () => {
            commentButt.disabled = false;
        }, { once: true }
        );

    }
    function newComment(comment, commentContainor, insertBefore) {
        const commentBody = document.createElement('div');
        commentBody.classList.add('commentBody');

        const commenterName = document.createElement('div');
        commenterName.classList.add('commenterName');
        commenterName.textContent = comment.name;

        const commentText = document.createElement('div');
        commentText.classList.add('commentText');
        commentText.textContent = comment.body;

        commentBody.appendChild(commenterName);
        commentBody.appendChild(commentText);
        if (insertBefore)
            commentContainor.insertBefore(commentBody, commentContainor.firstChild);
        else
            commentContainor.appendChild(commentBody);
    }
    function removeComents(commentContainor) {
        Array.from(commentContainor.children).forEach(child => child.remove());
    }

    function addInput(fullcommentContainor) {
        const inputBox = document.createElement('div');
        inputBox.classList.add('inputBox');

        const inputBar = document.createElement('input');
        inputBar.classList.add('inputBar');
        inputBar.type = 'text';

        const submit = document.createElement('button');
        submit.classList.add('submit');
        submit.textContent = 'Submit Comment';
        submit.addEventListener('click', () => addSubmitedComent(fullcommentContainor));

        inputBox.appendChild(inputBar);
        inputBox.appendChild(submit);
        fullcommentContainor.appendChild(inputBox);
    }

    function addSubmitedComent(fullcommentContainor) {
        const text = fullcommentContainor.querySelector('.inputBar');
        const inputValue = text.value;
        console.log(inputValue);
        if (inputValue) {
            text.value = '';
            newComment(
                { name: 'Anonymous', body: inputValue },
                fullcommentContainor.querySelector('.commentContainor'),
                true
            );
        }
    }


    createBloggers();
}()); 