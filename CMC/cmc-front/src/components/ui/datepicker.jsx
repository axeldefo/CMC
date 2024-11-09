import React from 'react';
import { Input } from './Input'; // Assurez-vous d'importer correctement le composant Input

const DatePicker = ({ label, selectedDate, onChangeDate }) => {
    return (
        <div>
            <label>{label}</label>
            <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onChangeDate(e.target.value)}
            />
        </div>
    );
};

export default DatePicker;
