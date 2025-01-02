import { useEffect } from "react";

export default function MakeComment(props) {
    const { comment, onRendered } = props;

    useEffect(() => {
        if (onRendered) {
            onRendered();
        }
    }, [onRendered]);

    if (!comment) return null;
    return (
        <>
            <div className='commentBody'>
                <div className='commenterName'>{comment.name}</div>
                <div className='commentText'>{comment.body}</div>
            </div>
        </>
    );
}