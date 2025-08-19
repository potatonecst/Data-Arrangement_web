import { Loader2 } from "lucide-react";

export default function AppLoader () {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div>
                <div className="flex w-full items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="ml-4 text-lg font-semibold">Now Loading...</p>
                </div>
                <div className="flex w-full items-center justify-center pt-5">
                    <p className="text-md font-semibold">この処理には時間がかかることがあります。</p>
                </div>
            </div>
        </div>
    )
}