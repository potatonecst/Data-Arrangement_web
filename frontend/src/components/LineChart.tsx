import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import Plotly from "plotly.js";
import type { Result } from '@/routes/Body';
import type { Data, Layout } from 'plotly.js';

import { Button } from '@/components/ui/button'

interface PlotProps {
    data: Result;
    saveFormat: "png" | "svg" | "jpeg" | "webp";
}

export default function LineChart({ data, saveFormat }: PlotProps) {
    let amountOfPlot = 1
    let legendYPos = 1.15
    const traces: Data[] = [
        {
            x: data.fdtd.theta,
            y: data.fdtd.intensity,
            type: 'scatter',
            mode: 'lines',
            name: 'FDTD Result',
            line: {
                color: "#005AFF",
            }
        },
    ];

    if (data.simpleSim) {
        traces.push({
            x: data.simpleSim.theta,
            y: data.simpleSim.intensity,
            type: 'scatter',
            mode: 'lines',
            name: `Simple Simulation Result (${data.simpleSim.alpha.toFixed(3)} deg.)`,
            line: {
                dash: 'dot',
                color: '#F6AA00'
            },
        });
        ++amountOfPlot;
    }

    if (data.fitting) {
        traces.push({
            x: data.fitting.theta,
            y: data.fitting.intensity,
            type: 'scatter',
            mode: 'lines',
            name: `Least Squares Result (${data.fitting.alpha.toFixed(3)} deg.)`,
            line: {
                dash: 'dot',
                color: '#03AF7A'
            },
        });
        ++amountOfPlot;
    }

    if (amountOfPlot === 3) legendYPos = 1.3;

    const chartId = "lineChart";
    const handleDownloadLineChart = (format: "png" | "svg" | "jpeg" | "webp") => {
        Plotly.downloadImage(chartId, {
            format: format,
            width: 600,
            height: 400,
            filename: "newplot",
        })
    }
    const handleDownloadIntensityData = () => {
        const dataToSave = {
            theta: data.fdtd.theta,
            intensity: data.fdtd.intensity,
        }
        const jsonString = JSON.stringify(dataToSave, null, 2); //JSON.stringify(value, replacer, space)
        const blob = new Blob([jsonString], {type: "application/json"}); //Blobコンストラクタ。valueは配列。MIMEタイプ="application/json"
        const url = URL.createObjectURL(blob); //blobの一時的なurlを作成
        const a = document.createElement("a"); //aタグを作成
        a.href = url; //href属性を設定
        a.download = "Intensity_Data.json" //download属性を設定
        document.body.appendChild(a); //ページにaタグを追加
        a.click(); //aタグをクリック
        document.body.removeChild(a); //ページからaタグを削除
        URL.revokeObjectURL(url); //urlを無効化
    }

    const containerRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState<Partial<Layout>>({
        xaxis: {
            title: {text: 'Angle of QWP [deg.]'},
            range: [0, 360],
            tick0: 0,
            dtick: 45,
        },
        yaxis: {
            title: {text: 'Intensity [arb. units]'},
            range: [0, 1.05],
            tick0: 0
        },
        margin: {
            l: 60,
            r: 20,
            b: 70,
            t: 10,
        },
        legend: {
            x: 1,
            xanchor: 'right',
            y: legendYPos,
            yanchor: 'top',
        },
        autosize: true,
    })

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const newWidth = containerRef.current.offsetWidth;
                setLayout(prev => ({
                    ...prev,
                    width: newWidth,
                }));
            }
        }

        let resizeTimer: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleResize, 100);
        }

        debouncedResize();
        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(resizeTimer);
        }
    }, []);

    return (
        <div ref={containerRef} className='grid items-center'>
            <Plot
            divId={chartId}
                data={traces}
                layout={layout}
                config={{
                    displaylogo: false,
                    modeBarButtonsToRemove: ['toImage'],
                }}
            />
            <div className="flex w-full gap-10 items-center justify-center">
                <Button onClick={() => handleDownloadLineChart(saveFormat)}>Download Image</Button>
                <Button onClick={handleDownloadIntensityData}>Download Intensity Data</Button>
            </div>
        </div>
    )
}