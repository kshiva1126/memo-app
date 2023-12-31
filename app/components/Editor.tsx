import MDEditor from '@uiw/react-md-editor';

type Props = {
  value: string;
  setValue: (value: string) => void;
}

export function Editor({ value, setValue }: Props) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        preview={'edit'}
        onChange={(value, event) => setValue(value || '')}
        height={500}
      />
    </div>
  );
}
