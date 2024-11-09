
import { useState, useEffect } from 'react'
import GeneratedInteractions from './components/generatedInteractions'
import InteractionsWithOthers from './components/interactionsWithOthers'
import TimeReceived from './components/timeReceived'
import TimeSpent from './components/timeSpent'
import Total from './components/total'
import './App.css'

function App() {


  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [forums, setForums] = useState([]); // State to hold forum options


  useEffect(() => {
    handleDefault();
  } , []);

  const handleDefault = async () => {
    try {
      console.log("Fetching default data...");
      const response = await fetch('/api/cmc/default', {
        method : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
      );
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      console.log("Response data:", data);

      const { minDate, maxDate, forums } = data;

      setStartDate(minDate.split('T')[0]);
      setEndDate(maxDate.split('T')[0]);
      setForums(['Tous', ...forums]);

    } catch (error) {
      console.error('Error fetching default data:', error);
    }
  };
  
  return (
    <div className='graph'>
      <Total defaultStartDate={startDate} defaultEndDate={endDate} allForums={forums} />
      <GeneratedInteractions defaultStartDate={startDate} defaultEndDate={endDate} allForums={forums} />
      <InteractionsWithOthers defaultStartDate={startDate} defaultEndDate={endDate} allForums={forums} />
      <TimeReceived defaultStartDate={startDate} defaultEndDate={endDate} allForums={forums} />
      <TimeSpent defaultStartDate={startDate} defaultEndDate={endDate} allForums={forums} />
    </div>
  )
}



export default App
