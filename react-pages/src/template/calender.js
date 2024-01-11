import React, {useState} from 'react';
import 'react-calendar/dist/Calendar.css';
import Calendar from 'react-calendar'

function Calender() {
  const [value, onChange] = useState(new Date());

  return (
    <div className="area calendar-wrap">
      <Calendar value={value}/>
    </div>
  );
}

export default Calender;
