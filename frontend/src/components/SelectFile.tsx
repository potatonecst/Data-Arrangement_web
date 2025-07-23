import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type SelectFileProps = {
    id: string;
    labelName: string;
    currentFilename: string;
    sendFilename: (s: string) => void;
}

export default function SelectFile({id, labelName, currentFilename, sendFilename}: SelectFileProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFilename = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const file = files?.item(0)
        if (file) {
            sendFilename(file.name);
        }
    }
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    }
    return (
        <div className="flex w-full max-w-sm items-center gap-2 py-0.5">
            <Label htmlFor={id} className="basis-1/5">{labelName}</Label>
            <input type="file" ref={fileInputRef} onChange={handleFilename} className="hidden" />
            <Input id={id} value={currentFilename} className="basis-3/5" />
            <Button variant="outline" onClick={handleBrowseClick} className="basis-1/5">Browse...</Button>
        </div>
    )
}