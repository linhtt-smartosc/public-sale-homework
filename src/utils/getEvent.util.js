async function getEvent(contract, eventName, receipt) {
    let event = [];
    receipt.logs.forEach(log => {
        try {
            const e = contract.interface.parseLog(log);
            if (e && e.name === eventName) {
                event.push(e);
            }
        } catch (error) {
            console.log(error);
        }
    });
    return event;
}

module.exports = getEvent;