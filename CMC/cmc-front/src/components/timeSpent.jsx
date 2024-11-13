import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsExporting from 'highcharts/modules/exporting';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import "./Style.css"

// Initialize the exporting module
HighchartsExporting(Highcharts);

export default function TimeSpent() {
    const defaultData = {
        minDate: "2009-02-12",
        maxDate: "2009-05-15",
        forums: [
            "Tous", "7", "10", "14", "11", "9", "329", "331", "332",
            "333", "330", "353", "354", "355", "13", "335", "336", "337",
            "339", "340", "341", "338", "358", "359", "360", "343",
            "344", "346", "347", "348", "362", "363", "16", "17", "326"
        ]
    };

    const [startDate, setStartDate] = useState(defaultData.minDate);
    const [endDate, setEndDate] = useState(defaultData.maxDate);
    const [forum, setForum] = useState('Tous');
    const [chartData, setChartData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setStartDate(defaultData.minDate);
        setEndDate(defaultData.maxDate);
        fetchChartData();
    }, []);

    const fetchChartData = async () => {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
            startDate: startDate || '',
            endDate: endDate || '',
            forum: forum === 'Tous' ? '' : forum,
        }).toString();

        try {
            const response = await fetch(`api/cmc/spent?${queryParams}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            setChartData(data);
        } catch (error) {
            console.error('Error:', error);
            setChartData({ error: "An error occurred while fetching data" });
        } finally {
            setIsLoading(false);
        }
    };

    const processChartData = () => {
        if (Object.keys(chartData).length === 0) return [];

        const usersData = Object.entries(chartData).map(([user, timeData]) => ({
            user,
            totalTime: Object.values(timeData).reduce((sum, time) => sum + time, 0),
            timeData
        }));

        const topUsers = usersData
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 5);

        return topUsers.map(user => ({
            name: user.user,
            data: Object.entries(user.timeData).map(([date, time]) => ({
                x: new Date(date).getTime(),
                y: time
            })),
            type: 'line'
        }));
    };
    // Chart configuration
    const chartOptions = {
        chart: {
            zoomType: 'x',
            type: 'line',
            width: 1000,
            height: 700,
        },
        title: {
            text: 'Time Spent Writing/Reading',
            enabled: false, // Hide title
        },
        xAxis: {
            type: 'datetime',
            title: { text: 'Date' },
        },
        yAxis: {
            title: { text: 'Points per Day' },
        },
        tooltip: {
            shared: true,
            crosshairs: true,
            pointFormat: '{series.name}: <b>{point.y}</b><br/>',
        },
        series: processChartData(),
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
        },
        exporting: {
            buttons: {
                contextButton: {
                    menuItems: [
                        'viewFullscreen',
                        'downloadPNG',
                        'downloadJPEG',
                        'downloadPDF',
                        'downloadSVG',
                        'downloadCSV',
                        'downloadXLS',
                        'viewData',
                    ],
                },
            },
            enabled: true,
        },
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <figure className="highcharts-figure" style={{ textAlign: 'center', padding: '20px' }}>
                <h1 className="text-3xl mb-4">Time Spent Writing/Reading</h1>
                <div className="flex items-center mb-4">
                    <label className="mr-2">Start Date:</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                    <label className="ml-4 mr-2">End Date:</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                    <label className="ml-4 mr-2">Forum:</label>
                    <Select value={forum} onValueChange={setForum} className="w-[180px]">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a forum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Forums</SelectLabel>
                                {defaultData.forums.map(f => (
                                    <SelectItem key={f} value={f}>
                                        {f}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {isLoading ? ( <Button className="ml-4" disabled>Loading...</Button> ) :
                 ( <Button onClick={fetchChartData} className="ml-4">Update</Button> )}
                </div>

                {isLoading ? (
                    <div className="spinner"></div>
                ) : (
                    <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                )}


            </figure>
        </div>
    );
}
