import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import Plotly from "plotly.js";
import type { Result } from '@/routes/Body';
import type { Data, Layout } from 'plotly.js';

import { Button } from "@/components/ui/button"

interface PlotProps {
    data: Result;
    saveFormat: "png" | "svg" | "jpeg" | "webp";
}

const generateSphereData = () => {
    const resolution = 50;
    const theta = Array.from({ length: resolution }, (_, i) => (Math.PI * i) / (resolution - 1));
    const phi = Array.from({ length: resolution }, (_, i) => (2 * Math.PI * i) / (resolution - 1));

    const x = theta.map(th => phi.map(ph => Math.sin(th) * Math.cos(ph)));
    const y = theta.map(th => phi.map(ph => Math.sin(th) * Math.sin(ph)));
    const z = theta.map(th => Array(resolution).fill(Math.cos(th)));

    return { x, y, z }
}

export default function PoincareChart({ data, saveFormat }: PlotProps) {
    const sphereData = generateSphereData();
    const labelData = {
        x: [1, -1, 0, 0, 0, 0], //S1
        y: [0, 0, 1, -1, 0, 0], //S2
        z: [0, 0, 0, 0, 1, -1], //S3
        text: ["H", "V", "D", "A", "R", "L"],
    };

    const traces: Data[] = [
        {
            ...sphereData,
            type: "surface",
            hidesurface: true,
            contours: {
                x: {
                    highlight: false,
                },
                y: {
                    highlight: false
                },
                z: {
                    show: true,
                    start: -1,
                    end: 1,
                    size: 0.05,
                    highlight: false
                },
            },
            colorscale: "Blues",
            opacity: 0.1,
            showscale: false,
            name: "Sphere",
            hoverinfo: "none",
        } as const,
        {
            ...labelData,
            type: "scatter3d",
            mode: "text+markers",
            marker: {color: "red", size: 2},
            showlegend: false,
            textposition: "top center"
        },
        {
            x: [0],
            y: [0],
            z: [0],
            text: ["O"],
            type: "scatter3d",
            mode: "text+markers",
            marker: {color: "Black", size: 3},
            showlegend: false,
        },
        {
            x: [data.fdtd.s1],
            y: [data.fdtd.s2],
            z: [data.fdtd.s3],
            type: "scatter3d",
            mode: "markers",
            marker: {color: "#005AFF", size: 4},
            name: "FDTD Result",
        },
        {
            x: [0, data.fdtd.s1],
            y: [0, data.fdtd.s2],
            z: [0, data.fdtd.s3],
            type: "scatter3d",
            mode: "lines",
            line: {color: "#005AFF", width: 2},
            showlegend: false,
        }
    ];

    if (data.simpleSim) {
        traces.push(
            {
                x: [data.simpleSim.s1],
                y: [data.simpleSim.s2],
                z: [data.simpleSim.s3],
                type: "scatter3d",
                mode: "markers",
                marker: {color: "#F6AA00", size: 4},
                name: `Simple Simulation Result (${data.simpleSim.alpha.toFixed(3)} deg.)`,
            },
            {
                x: [0, data.simpleSim.s1],
                y: [0, data.simpleSim.s2],
                z: [0, data.simpleSim.s3],
                type: "scatter3d",
                mode: "lines",
                line: {color: "#F6AA00", width: 2},
                showlegend: false,
            }
        )
    }

    if (data.fitting) {
        traces.push(
            {
                x: [data.fitting.s1],
                y: [data.fitting.s2],
                z: [data.fitting.s3],
                type: "scatter3d",
                mode: "markers",
                marker: {color: "#03AF7A", size: 4},
                name: `Least Squares Result (${data.fitting.alpha.toFixed(3)} deg.)`,
            },
            {
                x: [0, data.fitting.s1],
                y: [0, data.fitting.s2],
                z: [0, data.fitting.s3],
                type: "scatter3d",
                mode: "lines",
                line: {color: "#03AF7A", width: 2},
                showlegend: false,
            }
        )
    }

    const chartId = "poincare-chart";
    const handleDownloadPoincareChart = (format: "png" | "svg" | "jpeg" | "webp") => {
        Plotly.downloadImage(chartId, {
            format: format,
            width: 1200,
            height: 800,
            filename: "newplot"
        });
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState<Partial<Layout>>({
        scene: {
            aspectmode: "cube",
            xaxis: {
                title: {text: "S1"},
                showspikes: false,
                range: [-1, 1],
            },
            yaxis: {
                title: {text: "S2"},
                showspikes: false,
                range: [-1, 1],
            },
            zaxis: {
                title: {text: "S3"},
                showspikes: false,
                range: [-1, 1],
            },
        },
        margin: {l:0, r:0, b:10, t:0},
        legend: {
            x: 1,
            xanchor: "right",
            y: 0.95,
            yanchor: "top",
        },
    })

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const newWidth = containerRef.current.offsetWidth;
                const newHeight = containerRef.current.offsetHeight;
                setLayout(prev => ({
                    ...prev,
                    width: newWidth,
                    //height: newHeight
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
        <div ref={containerRef} className='grid items-center w-full'>
            <Plot
                divId={chartId}
                data={traces}
                layout={layout}
                className='w-full'
                style={{
                    width: "100%",
                    height: "100%",
                }}
                config={{
                    displaylogo: false,
                    modeBarButtonsToRemove: ['toImage'],
                }}
            />
            <Button onClick={() => handleDownloadPoincareChart(saveFormat)}>Download Image</Button>
        </div>
    )
}