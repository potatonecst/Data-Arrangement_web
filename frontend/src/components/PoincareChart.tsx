import Plot from 'react-plotly.js';
//import Plotly from "plotly.js";
import type { FDTDResult, SimpleSimResult, Result } from '@/routes/Body';
import type { Data } from 'plotly.js';

import { Button } from "@/components/ui/button"

interface PlotProps {
    data: Result;
    alpha: number;
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

export default function PoincareChart({ data, alpha }: PlotProps) {
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
                    highlight: false,
                },
                z: {
                    show:true,
                     start: -1,
                    end: 1,
                    size: 0.05,
                    usecolormap: true,
                    highlightcolor:"#42f462",
                }
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
            marker: {color: "Blue", size: 4},
            name: "FDTD Result",
        },
        {
            x: [0, data.fdtd.s1],
            y: [0, data.fdtd.s2],
            z: [0, data.fdtd.s3],
            type: "scatter3d",
            mode: "lines",
            line: {color: "Blue", width: 2},
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
                marker: {color: "Green", size: 4},
                name: `Simple Simulation Result (${alpha} deg.)`,
            },
            {
                x: [0, data.simpleSim.s1],
                y: [0, data.simpleSim.s2],
                z: [0, data.simpleSim.s3],
                type: "scatter3d",
                mode: "lines",
                line: {color: "green", width: 2},
                showlegend: false,
            }
        )
    }
    const chartId = "poincare-chart";
    /*
    const handleDownload = (format: "png" | "svg" | "jpeg") => {
        Plotly.downloadImage(chartId, {
            format: format,
            width: 1200,
            height: 800,
            filename: "newplot"
        });
    };
    */

    return (
        <div>
            <Plot
                divId={chartId}
                data={traces}
                layout={{
                    scene: {
                        aspectmode: "cube",
                        xaxis: {title: {text: "S1"}},
                        yaxis: {title: {text: "S2"}},
                        zaxis: {title: {text: "S3"}},
                    },
                    margin: {l:0, r:0, b:10, t:0},
                    legend: {
                        x: 1,
                        xanchor: "right",
                        y: 0.95,
                        yanchor: "top",
                    }
                }}
                className='w-full'
                config={{
                    displaylogo: false,
                    modeBarButtonsToRemove: ['toImage'],
                }}
            />
            <Button>Save Image</Button>
        </div>
    )
}