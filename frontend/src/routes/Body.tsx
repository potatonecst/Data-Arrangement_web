import { useOutletContext } from 'react-router-dom';
import { useState, useRef, type ChangeEvent, useEffect } from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { IconFolderSearch } from '@tabler/icons-react';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import { Loader2 } from "lucide-react";

import { readFileAsText } from '@/lib/ReadFileAsText';
import { API_BASE_URL } from '@/config';

import LineChart from '@/components/LineChart';
import PoincareChart from '@/components/PoincareChart';

interface FileContents {
    [key: string]: string;
}
interface Settings {
    divNo: number;
    EsRealName: string;
    EsImagName: string;
    EpRealName: string;
    EpImagName: string;
}
interface Values {
    simpleSim: boolean;
    alpha: number;
    fitting: boolean;
    initialAlpha: number;
}
interface AppContext {
    settingsValue: Settings;
    initialValues: Values
}
export interface FDTDResult {
    s1: number;
    s2: number;
    s3: number;
    theta: Array<number>;
    alpha: null;
    intensity: Array<number>;
}
export interface SimpleSimResult {
    s1: number;
    s2: number;
    s3: number;
    theta: Array<number>;
    alpha: number;
    intensity: Array<number>;
}
export interface FittingResult {
    s1: number;
    s2: number;
    s3: number;
    theta: Array<number>;
    alpha: number;
    intensity: Array<number>;
}
export interface Result {
    fdtd: FDTDResult;
    simpleSim: SimpleSimResult | null;
    fitting: FittingResult | null;
}
export default function Body() {
    const folderInputRef = useRef<HTMLInputElement>(null)
    const {settingsValue, initialValues} = useOutletContext<AppContext>(); //設定項目
    const [folderName, setFolderName] = useState("") //表示用
    const [isReading, setIsReading] = useState(false); //読み込み判定
    const [isCalculating, setIsCalculating] = useState(false) //計算判定
    const [isError, setIsError] = useState(false) //エラー判定用
    const [fileContents, setFileContents] = useState<FileContents | null>(null) //テキストファイル文字列
    const [currentValues, setCurrentValues] = useState<Values>(initialValues); //設定項目以外の値
    const [calculationResult, setCalculationResult] = useState(null);

    useEffect(() => {
        console.log("State has been updated: ", fileContents);
        if (!fileContents) {
            setIsError(true)
            console.log("fileContents is null")
        }
    }, [fileContents]);
    useEffect(() => {
        console.log("[Error State]: ", isError);
    }, [isError]);
    const handleBrowseFolderClick = () => {
        folderInputRef.current?.click();
    }
    const handleFolderName = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        } else if (files.length < 5) {
            alert('Required files are missing.\nCheck the folder component.');
            return;
        }
        setIsReading(true);
        setFileContents(null);
        try{
            console.log("Step1: Folder has been selected.");
            const requiredFilesName = [settingsValue.EsRealName, settingsValue.EsImagName, settingsValue.EpRealName, settingsValue.EpImagName]
            const contents: FileContents = {};
            for (const file of Array.from(files)) {
                if (requiredFilesName.includes(file.name)) {
                    contents[file.name] = await readFileAsText(file);
                }
            }
            if (Object.keys(contents).length < requiredFilesName.length) {
                throw new Error('Required files are missing.\nCheck the folder component.')
            }
            setFileContents(contents);
            console.log("Input complete");
            setIsError(false);
        } catch (error) {
            setIsError(true)
            let errorMessage = "An unknown error occured";
            console.error(error);
            if (error instanceof Error) {
                errorMessage = error.message
            }
            alert(errorMessage)
        } finally {
            setIsReading(false)
        }

        const file = files?.item(0)
        if (file) setFolderName(file.webkitRelativePath.split('/')[0]);
    }
    const handleSimpleSimCheckChange = () => {
        setCurrentValues(current => ({...current, ["simpleSim"]: !current.simpleSim}))
    }
    const handleSimpleSimAlphaChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentValues(current => ({...current, ["alpha"]: parseFloat(e.target.value)}))
    }
    const handleFittingCheckChange = () => {
        setCurrentValues(current => ({...current, ["fitting"]: !current.fitting}))
    }
    const handleInitialAlphaChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentValues(current => ({...current, ["initialAlpha"]: parseFloat(e.target.value)}))
    }
    const handleExecute = async () => {
        setIsCalculating(true);
        setCalculationResult(null);
        if (!fileContents) {
            alert("Required files are missing.")
            setIsCalculating(false)
            return;
        }
        if (!currentValues.simpleSim && !currentValues.alpha) {
            setCurrentValues(current => ({...current, ["alpha"]: 0}))
        }
        if (!currentValues.fitting && !currentValues.initialAlpha) {
            setCurrentValues(current => ({...current, ["initialAlpha"]: 0}))
        }
        try {
            const payload = {
                divNo: settingsValue.divNo,
                EsRealContent: fileContents[settingsValue.EsRealName],
                EsImagContent: fileContents[settingsValue.EsImagName],
                EpRealContent: fileContents[settingsValue.EpRealName],
                EpImagContent: fileContents[settingsValue.EpImagName],
                simpleSim: currentValues.simpleSim,
                alpha: currentValues.alpha || 0,
                fitting: currentValues.fitting,
                initialAlpha: currentValues.initialAlpha || 0,
            }
            const response = await fetch(`${API_BASE_URL}/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                let detailMessage = "Error occured in the server.";
                if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
                    detailMessage = errorData.detail[0].msg;
                } else if (typeof errorData.detail === "string") {
                    detailMessage = errorData.detail;
                }
                throw new Error(detailMessage)
            }
            const data = await response.json();
            setCalculationResult(data);
            //setLegendAlpha(currentValues.alpha);
        } catch (err) {
            if (err instanceof Error) {
                alert(err.message);
            } else {
                alert("Unexpected error occured.")
            }
        } finally {
            setIsCalculating(false);
        }
    }
    return (
        <div className='md:pt-5'>
            <div className='md:flex w-full gap-2'>
                <div className='basis-xl p-1'>
                    <Label htmlFor="folderSelect" className='text-lg'>Folder Select</Label>
                    <div className='flex gap-2'>
                        <Input value={folderName} placeholder='Select a folder...' disabled />
                        <Button variant="outline" onClick={handleBrowseFolderClick} disabled={isReading || isCalculating}><IconFolderSearch /><div className='md:hidden xg:block'>Browse...</div></Button>
                    </div>
                    <Input type='file' id="folderSelect" ref={folderInputRef} {...{webkitdirectory: "true"}} onChange={handleFolderName} className='hidden' />
                </div>
                <div className='h-auto'>
                    <Separator orientation="vertical" />
                </div>
                <div className='basis-xl p-1'>
                    <div className='flex items-baseline gap-4'>
                        <Label htmlFor="simpleSim" className='text-lg whitespace-nowrap'>Simple Simulation</Label>
                        <Switch id="simpleSim" onCheckedChange={handleSimpleSimCheckChange} />
                    </div>
                    <div className='flex items-baseline gap-2'>
                        <Label htmlFor="simpleSimAngle" className='whitespace-nowrap'>Angle [deg.]</Label>
                        <Input type='number' id="simpleSimAngle" value={currentValues.alpha} onChange={handleSimpleSimAlphaChange} disabled={!currentValues.simpleSim} />
                    </div>
                </div>
                <div className='h-auto'>
                    <Separator orientation="vertical" />
                </div>
                <div className='basis-xl p-1'>
                    <div className='flex items-baseline gap-4'>
                        <Label htmlFor="leastSquare" className='text-lg'>Least Squares</Label>
                        <Switch id="leastSquare" onCheckedChange={handleFittingCheckChange} />
                    </div>
                    <div className='flex gap-2'>
                        <Label htmlFor="leastSquaresAngle" className='whitespace-nowrap'>Initial Angle [deg.]</Label>
                        <Input type='number' id="leastSquaresAngle" value={currentValues.initialAlpha} onChange={handleInitialAlphaChange} disabled={!currentValues.fitting} />
                    </div>
                </div>
                <div className='h-auto'>
                    <Separator orientation="vertical" />
                </div>
                <div className='basis-4xs p-1 place-content-center'>
                    <Button className='' onClick={handleExecute} disabled={isReading || isError || isCalculating}>{isReading ? <Loader2 className='animate-spin' /> : <IconPlayerPlayFilled />}<div className='md:hidden lg:block'>Start</div></Button>
                </div>
            </div>
            <Separator className='mt-1' />
            <div className='w-full pt-1'>
                <Label className='text-lg'>Graph Area</Label>
                <div className='w-full'>
                    {calculationResult && <LineChart data={calculationResult} />}
                </div>
            </div>
        </div>
    );
}