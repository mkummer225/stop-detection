export function secondsToHms(seconds: number) {
    const date = new Date(seconds * 1000); // Convert seconds to milliseconds
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const secs = date.getUTCSeconds();
  
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}