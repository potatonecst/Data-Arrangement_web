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

interface SettingsValues {
    divNo: number;
    EsRealName: string;
    EsImagName: string;
    EpRealName: string;
    EpImagName: string;
}

interface SettingsSheetProps {
    currentValues: SettingsValues;
    sendCurrentValues: (arr: SettingsValues) => void;
}

export default function SettingsSheet({ currentValues, sendCurrentValues }: SettingsSheetProps) {
    const [temporaryValues, setTemporaryValues] = useState(currentValues);
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTemporaryValues(current => ({...current, [name]: value}));
    }
    const handleFilename = (name: string, filename: string) => {
        setTemporaryValues(current => ({...current, [name]: filename}))
    }
    const updateCurrentValues = () => {
        sendCurrentValues(temporaryValues);
    }
    const cancelChange = () => {
        setTemporaryValues(currentValues);
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
                        <Input id="divNo" type="number" name="divNo" value={temporaryValues.divNo} min="1" step="1" onChange={handleChange} />
                    </div>
                    <Separator />
                    <div>
                        <Label className="pb-4">Filename</Label>
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
                            <SelectFile id="esReal" name={"EsRealName"} labelName="Es_real" currentFilename={temporaryValues.EsRealName} sendFilename={handleFilename} />
                            <SelectFile id="esImag" name={"EsImagName"} labelName="Es_imag" currentFilename={temporaryValues.EsImagName} sendFilename={handleFilename} />
                            <SelectFile id="epReal" name={"EpRealName"} labelName="Ep_real" currentFilename={temporaryValues.EpRealName} sendFilename={handleFilename} />
                            <SelectFile id="epImag" name={"EpImagName"} labelName="Ep_imag" currentFilename={temporaryValues.EpImagName} sendFilename={handleFilename} />
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button onClick={updateCurrentValues}>Apply</Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button variant="outline" onClick={cancelChange}>Cancel</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}