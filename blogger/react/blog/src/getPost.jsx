export default async function GetPosts(id){

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