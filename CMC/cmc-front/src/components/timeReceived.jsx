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

export default function TimeReceived ({defaultStartDate, defaultEndDate, allForums}) {
    const [startDate, setStartDate] = useState(defaultStartDate || '');
    const [endDate, setEndDate] = useState(defaultEndDate || '');
    const [forum, setForum] = useState('Tous');
    const [generated, setGenerated] = useState({});
    const [forums, setForums] = useState(allForums || []);

    useEffect(() => {
        if (defaultStartDate && defaultEndDate && allForums) {
            setStartDate(defaultStartDate);
            setEndDate(defaultEndDate);
            setForums(allForums);
            handleWithOthers();
        }
    }, [defaultStartDate, defaultEndDate, allForums]);


    const handleWithOthers = async () => {
        const queryParams = new URLSearchParams({
            startDate: startDate || '',
            endDate: endDate || '',
            forum: forum === 'Tous' ? '' : forum, // Set forum to null if "Tous" is selected
        }).toString();

        try {
            const response = await fetch(`/api/cmc/received?${queryParams}`, {
                method : 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            setGenerated(data);
        } catch (error) {
            console.error('Error:', error);
            setGenerated({ error: "An error occurred while fetching data" });
        }
    };


    const processChartData = () => {
        if (Object.keys(generated).length === 0) return [];

        const userPoints = Object.entries(generated).map(([user, dates]) => ({
            user,
            totalPoints: Object.values(dates).reduce((sum, points) => sum + points, 0),
            dates
        }));

        const topUsers = userPoints
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 5);

        return topUsers.map(user => ({
            name: user.user,
            data: Object.entries(user.dates).map(([date, points]) => ({
                x: new Date(date).getTime(),
                y: points
            })),
            type: 'line'
        }));
    };

    const options = {
        chart: {
            zoomType: 'x',
            type: 'line',
            width: 1000,
            height: 700
        },
        title: {
            text: 'Time other people spent writing/reading the user',
            style: {
                fontSize: '0px', // Make the title larger
            },
            enabled: false
        },
        xAxis: {
            type: 'datetime',
            title: { text: 'Date' }
        },
        yAxis: {
            title: { text: 'Points per Day' }
        },
        tooltip: {
            shared: true,
            crosshairs: true,
            pointFormat: '{series.name}: <b>{point.y}</b><br/>'
        },
        series: processChartData(),
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
        },
        exporting: {
            buttons: {
                contextButton: {
                    menuItems: [
                        'viewFullscreen',
                        'separator',
                        'downloadPNG',
                        'downloadJPEG',
                        'downloadPDF',
                        'downloadSVG',
                        'separator',
                        'downloadCSV',
                        'downloadXLS',
                        'viewData'
                    ]
                }
            },
            enabled: true
        }
    };


    return (
        <div className="flex flex-col items-center justify-center h-screen">
            
            <figure className="highcharts-figure" style={{ textAlign: 'center', padding: '20px' }}>
                <h1 className="text-3xl mb-4">Time other people spent writing/reading the user</h1>
            <div className="flex items-center mb-4">
                <label htmlFor="startDate" className="mr-2">Start Date:</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <label htmlFor="endDate" className="ml-4 mr-2">End Date:</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <label htmlFor="forum" className="ml-4 mr-2">Forum:</label>
                <Select value={forum} onValueChange={setForum} className="w-[180px]">
                    <SelectTrigger>
                        <SelectValue placeholder="Select a forum" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Forums</SelectLabel>
                            {forums.map(forumValue => (
                                <SelectItem key={forumValue} value={forumValue}>
                                    {forumValue}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Button onClick={handleWithOthers} className="ml-4">Mise à jour</Button>
            </div>
                <HighchartsReact highcharts={Highcharts} options={options} />
            </figure>
        </div>
    );
};

