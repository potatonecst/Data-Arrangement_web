import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator} from "@/components/ui/separator"
import { 
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { IconSettings } from "@tabler/icons-react"
import SelectFile from "./SelectFile";

interface SettingsValues {
    divNo: number;
    simPropDir: boolean;
    fiberRadius: number;
    wavelength: number;
    initialPol: boolean;
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
    const handleRadioChange = (n: string) => {
        return (v: string) => {
            setTemporaryValues(current => ({...current, [n]: v === "1" ? 1 : 0}));
        }
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
            <SheetContent className="flex h-screen flex-col p-0">
                <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                    <SheetDescription>
                        各種設定を変更できます。
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1 w-full min-h-0">
                    <div className="grid flex-1 auto-rows-min gap-6 px-4">
                        <div>
                            <Label htmlFor="divNo" className="pb-4 font-bold">Division No.</Label>
                            <Input id="divNo" type="number" name="divNo" value={temporaryValues.divNo} min="1" step="1" onChange={handleChange} />
                        </div>
                        <Separator />
                        <div>
                            <Label className="pb-4 font-bold">Laser Direction of Propagation</Label>
                            <RadioGroup value={temporaryValues.simPropDir ? "1" : "0"} className="flex w-full items-center justify-center" onValueChange={handleRadioChange("simPropDir")}>
                                <div className="flex w-2/3 justify-between">
                                    <div className="flex items-center gap-1">
                                        <RadioGroupItem value="0" id="forward" />
                                        <Label htmlFor="forward">Forward</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <RadioGroupItem value="1" id="backward" />
                                        <Label htmlFor="backward">Backward</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                        <Separator />
                        <div>
                            <Label htmlFor="fiberRadius" className="pb-4 font-bold">Fiber Radius [nm]</Label>
                            <Input id="fiberRadius" type="number" name="fiberRadius" value={temporaryValues.fiberRadius} min="1" step="1" onChange={handleChange} />
                        </div>
                        <Separator />
                        <div>
                            <Label htmlFor="wavelength" className="pb-4 font-bold">Wavelength [nm]</Label>
                            <Input id="wavelength" type="number" name="wavelength" value={temporaryValues.wavelength} min="1" step="1" onChange={handleChange} />
                        </div>
                        <Separator />
                        <div>
                            <Label className="pb-4 font-bold">Lazer Polarization</Label>
                            <RadioGroup value={temporaryValues.initialPol ? "1" : "0"} className="flex w-full items-center justify-center" onValueChange={handleRadioChange("initialPol")}>
                                <div className="flex w-11/12 justify-between">
                                    <div className="flex items-center gap-1">
                                        <RadioGroupItem value="1" id="xPol" />
                                        <Label htmlFor="xPol">Quasi x-Polarization</Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <RadioGroupItem value="0" id="yPol" />
                                        <Label htmlFor="yPol">Quasi y-Polarization</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                        <Separator />
                        <div>
                            <Label className="pb-4 font-bold">Filename</Label>
                            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
                                <SelectFile id="esReal" name={"EsRealName"} labelName="Es_real" currentFilename={temporaryValues.EsRealName} sendFilename={handleFilename} />
                                <SelectFile id="esImag" name={"EsImagName"} labelName="Es_imag" currentFilename={temporaryValues.EsImagName} sendFilename={handleFilename} />
                                <SelectFile id="epReal" name={"EpRealName"} labelName="Ep_real" currentFilename={temporaryValues.EpRealName} sendFilename={handleFilename} />
                                <SelectFile id="epImag" name={"EpImagName"} labelName="Ep_imag" currentFilename={temporaryValues.EpImagName} sendFilename={handleFilename} />
                            </div>
                        </div>
                    </div>
                </ScrollArea>
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