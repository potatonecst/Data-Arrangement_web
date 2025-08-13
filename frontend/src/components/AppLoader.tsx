import { Loader2 } from "lucide-react";

export default function AppLoader () {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg font-semibold">Now Loading...</p>
            <p className="ml-4 text-lg font-semibold">この処理には時間がかかることがあります。</p>
        </div>
    )
}