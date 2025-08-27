import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconFileSearch } from "@tabler/icons-react";

type SelectFileProps = {
    id: string;
    name: string
    currentFilename: string;
    sendFilename: (s1: string, s2: string) => void;
}

export default function SelectFile({id, name, currentFilename, sendFilename}: SelectFileProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFilename = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const file = files?.item(0)
        if (file) {
            sendFilename(e.target.name, file.name);
        }
    }
    const handleVisibleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        sendFilename(e.target.name, e.target.value);
    }
    const handleBrowseFileClick = () => {
        fileInputRef.current?.click();
    }
    return (
        <>
            <input type="file" name={name} ref={fileInputRef} onChange={handleFilename} className="hidden" />
            <Input id={id} name={name} value={currentFilename} onChange={handleVisibleFileInput} />
            <Button variant="outline" onClick={handleBrowseFileClick}><IconFileSearch />Browse...</Button>
        </>
    )
}