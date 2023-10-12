function generateTimeslot(timeDifference, slotDifference, startTime, startText) {
    const timeslotsByDay = [];
    const timeslots = [];
    let changeableTime = startTime;
    for (let i = startTime; i < 12; i++) {
        if (changeableTime == 14) {
            break;
        }
        // if(changeableTime > 12) {
        //   console.log(i);
        //   console.log(changeableTime)
        //   changeableTime -= 12;
        // }
        const slotInfo = {
            slotStart: changeableTime,
            slotEnd: changeableTime + timeDifference
        }
        changeableTime = changeableTime + slotDifference
        timeslots.push(slotInfo);
    }
    for (var slot of timeslots) {
        if (slot.slotStart == 12) {
            slot.slotStartAMPM = "PM"
        }
        if (slot.slotEnd == 12) {
            slot.slotEndAMPM = "PM"
        }

        if (slot.slotStart < 12) {
            // console.log(`LESS THEN 12 AND START AM ${slot.slotStart}`);
            slot.slotStartAMPM = "AM"
        }
        if (slot.slotEnd < 12) {
            // console.log(`LESS THEN 12 AND END AM ${slot.slotEnd}`);
            slot.slotEndAMPM = "AM"
        }
        if (slot.slotStart > 12) {
            // console.log(`GREAOR THEN 12 AND START PM ${slot.slotStart}`);
            slot.slotStartAMPM = "PM"
            slot.slotStart -= 12;
        }
        if (slot.slotEnd > 12) {
            // console.log(`GREAOR THEN 12 AND START PM ${slot.slotEnd}`);
            slot.slotEndAMPM = "PM"
            slot.slotEnd -= 12;
        }

        slot.slotStart = `${slot.slotStart}:00 ${slot.slotStartAMPM}`;
        slot.slotEnd = `${slot.slotEnd}:00 ${slot.slotEndAMPM}`;
        // console.log(`${slot.slotStart} - ${slot.slotEnd}`)
    }
    for (let time of timeslots) {
        const { slotStart, slotEnd } = time;
        const timeString = `${startText} ${slotStart} - ${slotEnd}`;
        timeslotsByDay.push(timeString);
    }
    return timeslotsByDay;
}

module.exports = {
    generateTimeslot
}