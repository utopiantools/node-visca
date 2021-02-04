"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v2i = exports.i2v = exports.v2si = exports.si2v = exports.nibbles = exports.testBit = void 0;
// HELPER FUNCTIONS
function testBit(val, mask) { return (val & mask) == mask; }
exports.testBit = testBit;
function nibbles(data) {
    let result = [];
    for (let d of data) {
        let pq = d;
        let p = pq >> 4;
        let q = pq & 0b1111;
        result.push(p);
        result.push(q);
    }
    return result;
}
exports.nibbles = nibbles;
function si2v(value) {
    // first, handle the possibility of signed integer values
    if (value > 32767)
        value = 32767;
    if (value < -32768)
        value = -32768;
    if (value < 0)
        value = 0xffff + value + 1; // this is the magic
    return i2v(value);
}
exports.si2v = si2v;
// data must be a buffer or array
function v2si(data) {
    if (data.length == 2)
        data = [0, 0, ...data];
    let value = v2i(data);
    if (value > 32767)
        value = value - 0xffff - 1;
    return value;
}
exports.v2si = v2si;
function i2v(value) {
    // return word as dword in visca format
    // packets are not allowed to be 0xff
    // so for numbers the first nibble is 0b0000
    // and 0xfd gets encoded into 0x0f 0x0d
    let ms = (value & 0b1111111100000000) >> 8;
    let ls = value & 0b0000000011111111;
    let p = (ms & 0b11110000) >> 4;
    let r = (ls & 0b11110000) >> 4;
    let q = ms & 0b1111;
    let s = ls & 0b1111;
    return [p, q, r, s];
}
exports.i2v = i2v;
function v2i(data) {
    if (data.length == 2)
        data = [0, 0, ...data];
    let [p, q, r, s] = data;
    let ls = (r << 4) | (s & 0b1111);
    let ms = (p << 4) | (q & 0b1111);
    return (ms << 8) | ls;
}
exports.v2i = v2i;
// function takeClosest(myList:[], myNumber:number) {
// 	/// Assumes myList is sorted. Returns closest value to myNumber.
// 	/// If two numbers are equally close, return the smallest number.
// 	let pos = 0;
// 	for (var i = 0; i < myList.length; i++) {
// 		if (myNumber < myList[i]) break;
// 		else pos = i;
// 	}
// 	if (pos == 0) return myList[0];
// 	if (pos == myList.length) return myList[-1];
// 	before = myList[pos - 1];
// 	after = myList[pos];
// 	if (after - myNumber < myNumber - before) return after;
// 	else return before;
// }
//# sourceMappingURL=utils.js.map