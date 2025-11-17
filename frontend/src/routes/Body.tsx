import { useOutletContext } from 'react-router-dom';
import { useState, useRef, type ChangeEvent, useEffect } from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Spinner } from '@/components/ui/spinner';

import { IconFolderSearch } from '@tabler/icons-react';
import { IconPlayerPlayFilled } from '@tabler/icons-react';

import { readFileAsText } from '@/lib/ReadFileAsText';
import { API_BASE_URL } from '@/config';

import LineChart from '@/components/LineChart';
import PoincareChart from '@/components/PoincareChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FileContents {
    [key: string]: string;
}
interface Settings {
    resultFilename: string;
    simPropDir: boolean;
    fiberRadius: number;
    wavelength: number;
    initialPol: boolean;
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
type ImageFormat = "png" | "svg" | "jpeg" | "webp";
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
    const [saveFormat, setSaveFormat] = useState<ImageFormat>("png");

    useEffect(() => {
        console.log("State has been updated: ", fileContents);
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
        }
        setIsReading(true);
        setFileContents(null);
        try{
            console.log("Step1: Folder has been selected.\n Start arranging.");
            const requiredFilesName = [settingsValue.resultFilename]

            const filesToRead = Array.from(files).filter(file => requiredFilesName.includes(file.name));

            if (filesToRead.length < requiredFilesName.length) {
                throw new Error("Required files are missing.\nCheck the folder component.")
            }

            console.log(`Step2: ${filesToRead.length} required files are found.\nStart reading.`);

            const readPromises = filesToRead.map(file => {
                console.log(`- Start reading ${file.name}...`);
                return readFileAsText(file);
            });

            console.log("Step3: Waiting");
            const allContents = await Promise.all(readPromises);
            console.log("Step4: Read all files completed.")

            const contents: FileContents = {};
            filesToRead.forEach((file, index) => {
                contents[file.name] = allContents[index];
            })
            setFileContents(contents);
            console.log("Step5: Update state completed.");
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
                resultContent: fileContents[settingsValue.resultFilename],
                simpleSim: currentValues.simpleSim,
                alpha: currentValues.alpha || 0,
                fitting: currentValues.fitting,
                initialAlpha: currentValues.initialAlpha || 0,
                simPropDir: settingsValue.simPropDir,
                fiberRadius: settingsValue.fiberRadius,
                wavelength: settingsValue.wavelength,
                initialPol: settingsValue.initialPol,
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

    const handleSaveFormat = (newFormat: string) => {
        if (newFormat) {
            setSaveFormat(newFormat as ImageFormat);
        }
    }
    return (
        <div className='md:pt-5'>
            <div className='md:flex w-full gap-2'>
                <div className='basis-xl p-1'>
                    <Label htmlFor="folderSelect" className='text-lg font-bold'>Folder Select</Label>
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
                        <Label htmlFor="simpleSim" className='text-lg font-bold whitespace-nowrap'>Simple Simulation</Label>
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
                        <Label htmlFor="leastSquare" className='text-lg font-bold'>Least Squares</Label>
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
                    <Button className='' onClick={handleExecute} disabled={isReading || !fileContents || isCalculating}>
                        <div className="inline-block h-4 w-4">{isReading || isCalculating ? <Spinner className='w-full h-full' /> : <IconPlayerPlayFilled />}</div>
                        <div className='md:hidden lg:block'>Start</div></Button>
                </div>
            </div>
            <Separator className='mt-1' />
            {calculationResult && <div className='w-full pt-1'>
                <div className='w-full'>
                    <Tabs defaultValue="lineChart">
                        <div className='md:flex gap-5'>
                            <Label className='text-lg font-bold whitespace-nowrap'>Graph Area</Label>
                            <div className="flex justify-between w-full">
                                <TabsList>
                                    <TabsTrigger value="lineChart">Line Chart</TabsTrigger>
                                    <TabsTrigger value="poincareChart">Poincare Chart</TabsTrigger>
                                </TabsList>
                                <ToggleGroup type="single" variant="outline" value={saveFormat} onValueChange={handleSaveFormat}>
                                    <ToggleGroupItem value="png" aria-label='png' asChild>
                                        <Label>png</Label>
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="svg" aria-label='svg' asChild>
                                        <Label>svg</Label>
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="jpeg" aria-label='jpeg' asChild>
                                        <Label>jpeg</Label>
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="webp" aria-label='webp' asChild>
                                        <Label>webp</Label>
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>
                        <TabsContent value="lineChart" className='w-full'>
                            {calculationResult && <LineChart data={calculationResult} saveFormat={saveFormat} />}
                        </TabsContent>
                        <TabsContent value="poincareChart">
                            {calculationResult && <PoincareChart data={calculationResult} saveFormat={saveFormat} />}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>}
        </div>
    );
}