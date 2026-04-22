import "react-quill-new/dist/quill.snow.css";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";

const ArticleEditor = ({ content, setContent }) => {
   
    return (
        <div className="">
            <SimpleEditor value={content} onChange={setContent} placeholder={"Nhập bài giảng"} mention={null}></SimpleEditor>
        </div>
    );
};

export default ArticleEditor;
