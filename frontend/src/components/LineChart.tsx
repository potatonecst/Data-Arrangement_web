import Plot from 'react-plotly.js';
import type { FDTDResult, SimpleSimResult, Result } from '@/routes/Body';
import type { Data } from 'plotly.js';

interface PlotProps {
    data: Result
}

export default function LineChart({ data }: PlotProps) {
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
            name: `Simple Simulation Result (${data.fitting.alpha.toFixed(3)} deg.)`,
            line: {
                dash: 'dot',
                color: '#03AF7A'
            },
        });
        ++amountOfPlot;
    }

    if (amountOfPlot === 3) legendYPos = 1.2;

    return (
        <Plot 
            data={traces}
            layout={{
                xaxis: {
                    title: {text: 'Angle of QWP [deg.]'},
                    tick0: 0,
                    dtick: 45,
                },
                yaxis: {
                    title: {text: 'Intensity [Arb. units]'},
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
                }
            }}
            useResizeHandler={true}
            className="w-full"
        />
    )
}