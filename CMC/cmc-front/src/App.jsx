

import GeneratedInteractions from './components/generatedInteractions'
import InteractionsWithOthers from './components/interactionsWithOthers'
import TimeReceived from './components/timeReceived'
import TimeSpent from './components/timeSpent'
import Total from './components/total'
import './App.css'

function App() {

  
  return (
    <div className='graph'>
      <Total />
      <InteractionsWithOthers  />
      <GeneratedInteractions />
      <TimeSpent />
      <TimeReceived />
    </div>
  )
}



export default App
