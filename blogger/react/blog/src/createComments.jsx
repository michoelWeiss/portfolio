import GetComments from "./getComments";
import MakeComment from "./makecomments";
import { useState, useEffect } from "react";

export default function CreateComments(props) {
    const { id, onRendered } = props;
    const [comments, setComments] = useState([]);
    const [rendered, setRendered] = useState({ count: 0, total: 0 });

    const increment = () => {
        const current = rendered.count + 1;
        //     console.log(`total: ${rendered.total} current: ${current}`);
        if (current === rendered.total) {
            onRendered();
            // setComments(null);     // need to fix endless loop 
        }
        setRendered({
            ...rendered,
            count: current
        });
    };
    useEffect(() => {
        async function fetchComments(id) {
            const data = await GetComments(id);
            if (data) {
                setComments(data);
                setRendered({
                    ...rendered,
                    total: data.length
                });
            }

        }
        fetchComments(id);
    }, []);
    return (
        <>
            {comments && comments.length > 0
                ? comments.map((comment, index) => (
                    <MakeComment
                        key={index}
                        comment={comment}
                        onRendered={increment}
                    />
                ))
                : null}
        </>
    );
}