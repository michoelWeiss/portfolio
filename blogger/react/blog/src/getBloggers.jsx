export default async function GetBloggers(){
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