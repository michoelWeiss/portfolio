
import ReactDOM from "react-dom";
import MakeComment from "./makecomments";
export default function AddInputComment({ comment, commentContainor }){

    console.log(`commentContainor: ${commentContainor} commentContainor.current: ${commentContainor.current}`)
    return commentContainor.current
    ? ReactDOM.createPortal(
          <MakeComment comment={comment} />,
          commentContainor.current
      )
    : null;
}