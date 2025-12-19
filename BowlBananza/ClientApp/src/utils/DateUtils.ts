export function formatDate(date: Date): string {
    const mm = String(date.getMonth() + 1); // Months are 0-based
    const dd = String(date.getDate());
    const yyyy = date.getFullYear();

    return `${mm}/${dd}/${yyyy}`;
}

export function formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    // Convert 24h → 12h format
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;

    const paddedMinutes = minutes.toString().padStart(2, "0");

    return `${hours}:${paddedMinutes} ${ampm}`;
}