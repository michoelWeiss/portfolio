export default async function GetComments(id){
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