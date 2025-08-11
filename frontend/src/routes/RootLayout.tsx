import { useState } from "react";
import { Outlet, useLoaderData, useNavigation } from "react-router-dom";
//import { Button } from "@/components/ui/button";
//import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import SettingsSheet from "@/components/SettingsSheet";

interface LoaderData {
    divNo: number;
    EsRealName: string;
    EsImagName: string;
    EpRealName: string;
    EpImagName: string;
    simpleSim: boolean;
    alpha: number;
    fitting: boolean;
    initialAlpha: number;
}

const AppLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-semibold">Now Loading...</p>
    </div>
)

export default function RootLayout() {
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";
    const loaderData = useLoaderData() as LoaderData;
    const initialSettingsData = {
        divNo: loaderData.divNo,
        EsRealName: loaderData.EsRealName,
        EsImagName: loaderData.EsImagName,
        EpRealName: loaderData.EpRealName,
        EpImagName: loaderData.EpImagName,
    };
    const initialValues = {
        simpleSim: loaderData.simpleSim,
        alpha: loaderData.alpha,
        fitting: loaderData.fitting,
        initialAlpha: loaderData.initialAlpha,
    };
    //const [settingsValue, setSettingsValue] = useState<Array<string | number>>([201, "Es_real.txt", "Es_imag.txt", "Ep_real.txt", "Ep_imag.txt"])
    const [settingsValue, setSettingsValue] = useState(initialSettingsData)
    return (
        <div className="container mx-auto p-4">
            <header className="">
                <div className="md:flex font-melete items-baseline gap-2">
                    <h1 className="font-bold text-sm md:text-xl lg:text-2xl">Data Arranger for FDTD</h1>
                    <p className="text-[10px] md:text-sm whitespace-nowrap">ver 0.3.0</p>
                </div>
                <SettingsSheet currentValues={settingsValue} sendCurrentValues={setSettingsValue} />
            </header>
            <main>
                {isLoading ? <AppLoader /> : <Outlet context={{settingsValue, initialValues}} />}
            </main>
        </div>
    );
}