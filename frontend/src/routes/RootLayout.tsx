import { Suspense, useState } from "react";
import { Outlet, useLoaderData } from "react-router-dom";
//import { Button } from "@/components/ui/button";
//import { Label } from "@/components/ui/label";
//import { Loader2 } from "lucide-react";

import SettingsSheet from "@/components/SettingsSheet";
import AppLoader from "@/components/AppLoader";

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

const LoadedLayout = () => {
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
    const [settingsValue, setSettingsValue] = useState(initialSettingsData);
    return (
        <>
            <header className="">
                <div className="md:flex font-melete items-baseline gap-2">
                    <h1 className="font-bold text-sm md:text-xl lg:text-2xl">Data Arranger for FDTD</h1>
                    <p className="text-[10px] md:text-sm whitespace-nowrap">ver 0.3.0</p>
                </div>
                <SettingsSheet currentValues={settingsValue} sendCurrentValues={setSettingsValue} />
            </header>
            <main>
                <Outlet context={{settingsValue, initialValues}} />
            </main>
        </>
    );
}

export default function RootLayout() {
    return (
        <div className="container mx-auto p-4">
            <Suspense fallback={<AppLoader />}>
                <LoadedLayout />
            </Suspense>
        </div>
    );
}