export const formatLocalTime = (dateStr) => {
  if (!dateStr) return '--:--';
  let str = String(dateStr).trim();
  
  // If string contains space instead of 'T' (e.g. '2026-08-23 10:40:00'), replace space with 'T'
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }
  
  // If string doesn't end with 'Z' or timezone offset, append 'Z' so JS knows it is UTC
  if (!str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
    str = `${str}Z`;
  }
  
  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return '--:--';
  
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatLocalDate = (dateStr) => {
  if (!dateStr) return '--';
  let str = String(dateStr).trim();
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }
  if (!str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
    str = `${str}Z`;
  }
  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString();
};
