import { weekdays, mappingWeekToArrayIndex } from '../config/constant';
import { DayObj, DayOfWeek, Frame } from '../types';
import toDate from 'date-fns/toDate';
import { utcToZonedTime, format } from 'date-fns-tz';

export const hourToString = (start: number, end: number) => {
  const arr = [];
  for (let i = start; i < end; i++) {
    if (i < 10) arr.push('0' + i);
    else arr.push(i.toString());
  }
  return arr;
};

export const process = (
  customersSerie: Frame,
  employee: number,
  open_hour: number,
  close_hour: number,
  timeZone: string
) => {
  console.log('employee ', employee);
  const hours = hourToString(open_hour, close_hour);
  const narr = [...Array(employee + 1).keys()].slice(1).reverse();
  const template = narr.map(i => {
    const obj: { emp: number; [key: string]: any } = { emp: i };

    hours.map(hour => {
      obj[hour] = null;
    });

    return obj;
  });

  customersSerie.fields[1].values.buffer.map((timestamp, idx) => {
    const zonedDate = utcToZonedTime(toDate(timestamp), timeZone);
    const dayOfWeek = format(zonedDate, 'eee', { timeZone }) as DayOfWeek;
    const hour = format(zonedDate, 'HH', { timeZone });

    if (dayOfWeek !== 'Sun' && hours.includes(hour)) {
      const ratio = Math.floor(customersSerie.fields[0].values.buffer[idx] / employee);
      console.log('hour ', hour, ' ratio ', ratio);
      const bound = ratio > employee ? employee - 1 : ratio;
      for (let j = 0; j < bound; j++) {
        if (j < 5) template[employee - 1 - j][hour] = 10;
        else template[employee - 1 - j][hour] = 20;
      }
    }
  });

  return { data: template, keys: hours };
};

export const processData = (
  valueArr: number[],
  timestampArr: number[],
  timeZone: string,
  open_hour: number,
  close_hour: number
) => {
  const keepTrackWeek: Array<{ [key: string]: number }> = [];
  // const timeZone = 'Europe/Berlin';
  const hours = hourToString(open_hour, close_hour);

  const templateTable = weekdays.map(weekday => {
    const obj: DayObj = { date: weekday };
    hours.map(hour => {
      obj[hour] = 0;
    });
    const { date, ...rest } = obj;
    keepTrackWeek.push(rest);
    return obj;
  });

  timestampArr.map((timestamp, idx) => {
    const zonedDate = utcToZonedTime(toDate(timestamp), timeZone);
    const dayOfWeek = format(zonedDate, 'eee', { timeZone }) as DayOfWeek;
    const hour = format(zonedDate, 'HH', { timeZone });

    if (dayOfWeek !== 'Sun' && hours.includes(hour)) {
      templateTable[mappingWeekToArrayIndex[dayOfWeek]][hour] += valueArr[idx];
      keepTrackWeek[mappingWeekToArrayIndex[dayOfWeek]][hour] += 1;
    }
  });

  for (let i = 0; i < 6; i++) {
    hours.map(hour => {
      if (templateTable[i][hour] == 0) {
        templateTable[i][hour] = null;
      } else {
        templateTable[i][hour] = Math.round((templateTable[i][hour] / keepTrackWeek[i][hour]) * 100) / 100;
      }
    });
  }

  return { data: templateTable };
};
