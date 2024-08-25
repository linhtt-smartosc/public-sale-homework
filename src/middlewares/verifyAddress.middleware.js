export function checkValidAddress(address) {
    if (address.startsWith('0x',0) && address.length === 66) {
        return true;
    }
    return false
}
export function checkValidKey(key) {
    
}
