import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator} from "@/components/ui/separator"
import { Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { IconSettings } from "@tabler/icons-react"
import SelectFile from "./SelectFile";

export default function SettingsSheet() {
    const [divNo, setDivNo] = useState<number>(201);
    const [filenames, setFilenames] = useState<Array<string>>(["Es_real.txt", "Es_imag.txt", "Ep_real.txt", "Ep_imag.txt"]);
    const handleDivNoChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDivNo(Number(e.target.value));
    }
    const updateFilenames = (i: number, newFilename: string) => {
        const newFilenames = [...filenames]
        newFilenames[i] = newFilename;
        setFilenames(newFilenames);
    }
    return (
        <Sheet>
            <div className="flex justify-end">
                <SheetTrigger asChild>
                    <Button variant="outline">
                        <IconSettings />Settings
                    </Button>
                </SheetTrigger>
            </div>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                    <SheetDescription>
                        各種設定を変更できます。
                    </SheetDescription>
                </SheetHeader>
                <div className="grid flex-1 auto-rows-min gap-6 px-4">
                    <div>
                        <Label htmlFor="divNo" className="pb-4">Division No.</Label>
                        <Input id="divNo" type="number" value={divNo} min="1" step="1" onChange={handleDivNoChange} />
                    </div>
                    <Separator />
                    <div>
                        <Label className="pb-4">Filename</Label>
                        <SelectFile id="esReal" labelName="Es_real" currentFilename={filenames[0]} sendFilename={(newFilename: string) => updateFilenames(0, newFilename)} />
                        <SelectFile id="esImag" labelName="Es_imag" currentFilename={filenames[1]} sendFilename={(newFilename: string) => updateFilenames(1, newFilename)} />
                        <SelectFile id="epReal" labelName="Ep_real" currentFilename={filenames[2]} sendFilename={(newFilename: string) => updateFilenames(2, newFilename)} />
                        <SelectFile id="epImag" labelName="Ep_imag" currentFilename={filenames[3]} sendFilename={(newFilename: string) => updateFilenames(3, newFilename)} />
                    </div>
                </div>
                <SheetFooter>
                    <Button>Apply</Button>
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}