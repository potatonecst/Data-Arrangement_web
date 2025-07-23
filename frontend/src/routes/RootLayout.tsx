import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import SettingsSheet from "@/components/SettingsSheet";

/*
const handleClick = () => {

}
*/

export default function RootLayout() {
    return (
        <div className="container mx-auto p-4 min-w-[610px]">
            <header className="">
                <div className="flex font-melete items-baseline gap-2">
                    <h1 className="font-bold text-sm md:text-xl lg:text-2xl">Data Arranger for FDTD</h1>
                    <p className="text-xs whitespace-nowrap">ver 0.3.0</p>
                </div>
                <SettingsSheet />
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}