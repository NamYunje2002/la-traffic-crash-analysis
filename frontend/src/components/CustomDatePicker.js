import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { ko } from 'date-fns/locale';
import { useState } from 'react';

const CustomDatePicker = ({ minDate, maxDate, handleSearch }) => {
  const [startDateTime, setStartDateTime] = useState(minDate);
  const [endDateTime, setEndDateTime] = useState(maxDate);

  return (
    <div style={{ margin: '2rem 0px' }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={ko}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <DateTimePicker
            label="시작 날짜"
            value={startDateTime}
            onChange={(newValue) => setStartDateTime(newValue)}
            minDateTime={minDate}
            maxDateTime={maxDate}
            ampm={false}
            format="yyyy-MM-dd HH:mm"
            sx={{
              '& .MuiFormLabel-root': {
                zIndex: 'auto',
              },
            }}
          />
          <span>-</span>
          <DateTimePicker
            label="종료 날짜"
            value={endDateTime}
            onChange={(newValue) => setEndDateTime(newValue)}
            minDateTime={startDateTime}
            maxDateTime={maxDate}
            ampm={false}
            format="yyyy-MM-dd HH:mm"
            sx={{
              '& .MuiFormLabel-root': {
                zIndex: 'auto',
              },
            }}
          />
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => handleSearch(startDateTime, endDateTime)}
          >
            검색
          </button>
        </div>
      </LocalizationProvider>
    </div>
  );
};

export default CustomDatePicker;
