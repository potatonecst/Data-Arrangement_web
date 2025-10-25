import { Suspense, useState } from "react";
import { Outlet, useLoaderData, Await } from "react-router-dom";

import SettingsSheet from "@/components/SettingsSheet";
import AppLoader from "@/components/AppLoader";

interface LoaderData {
    resultFilename: string;
    simpleSim: boolean;
    alpha: number;
    fitting: boolean;
    initialAlpha: number;
    simPropDir: boolean;
    fiberRadius: number;
    wavelength: number;
    initialPol: boolean;
}

const LoadedLayout = ({resolvedData}: {resolvedData: LoaderData}) => {
    const initialSettingsData = {
        resultFilename: resolvedData.resultFilename,
        simPropDir: resolvedData.simPropDir,
        fiberRadius: resolvedData.fiberRadius,
        wavelength: resolvedData.wavelength,
        initialPol: resolvedData.initialPol,
    };
    const initialValues = {
        simpleSim: resolvedData.simpleSim,
        alpha: resolvedData.alpha,
        fitting: resolvedData.fitting,
        initialAlpha: resolvedData.initialAlpha,
    };
    const [settingsValue, setSettingsValue] = useState(initialSettingsData);
    return (
        <>
            <header className="">
                <div className="md:flex font-melete items-baseline gap-2">
                    <h1 className="font-bold text-sm md:text-xl lg:text-2xl">Data Arranger for FDTD</h1>
                    <p className="text-[10px] md:text-sm whitespace-nowrap">ver 0.5.0</p>
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
    const {initialData} = useLoaderData() as {initialData: Promise<LoaderData>};
    return (
        <div className="container mx-auto p-4">
            <Suspense fallback={<AppLoader />}>
                <Await
                    resolve={initialData}
                    errorElement={
                        <div className="flex h-screen w-full items-center justify-center bg-background">
                            <p className="text-xl font-bold text-destructive text-center">Failed to load data.<br />Try Again!</p>
                        </div>
                    }
                >
                    {(resolvedData: LoaderData) => (
                        <LoadedLayout resolvedData={resolvedData} />
                    )}
                </Await>
            </Suspense>
        </div>
    );
}