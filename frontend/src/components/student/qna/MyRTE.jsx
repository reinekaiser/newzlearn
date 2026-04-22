import { SimpleEditor } from '@/components/tiptap/tiptap-templates/simple/simple-editor'
import React from 'react'

function MyRichTextEditor({value, onChange, className , placeholder, mention = null}) {
  // Chỉnh hàm handleImageUpload() trong tiptap-utils.js để hoàn tất xử lý ảnh
  return (
    <div className={className}>
        <SimpleEditor value={value} onChange={onChange} placeholder={placeholder} mention={mention}/>
    </div>
    
  )
}

export default MyRichTextEditor