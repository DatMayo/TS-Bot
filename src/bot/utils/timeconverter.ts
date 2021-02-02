export function timeConverter(timestamp: number): string {
    const a = new Date(timestamp * 1000);
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const year = a.getFullYear();
    const month = months[a.getMonth()];
    const date = a.getDate();
    const hour = a.getHours().toString().padStart(2, '0');
    const min = a.getMinutes().toString().padStart(2, '0');
    // Der folgende Doppelpunkt ist das Unicodezeichen U+A789 und kein normaler Doppelpunkt. Dies dient dazu TS Smileys zu unterdrücken.
    return `${date}. ${month} ${year} um ${hour}꞉${min} Uhr`;
}
