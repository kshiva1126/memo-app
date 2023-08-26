import { useState } from "react";
import { Editor } from "~/components/Editor";

export default function Edit() {
  const [value, setValue] = useState('# Hello, world!');

  return (
    <div>
      <Editor value={value} setValue={setValue} />
    </div>
  )
}
