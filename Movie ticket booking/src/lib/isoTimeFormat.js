const isoTimeFormat = (dateTime) =>  {
    const date = new Date(dateTime)
    const localDate = date.toLocaleTimeString("en-US",{
        hour:"2-digit",
        minute:"2-digit",
        hour12:true
    })
    return localDate;
}

export default isoTimeFormat
