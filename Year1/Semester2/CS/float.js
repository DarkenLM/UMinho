/*
FLOAT CONVERSION ALGORITHM

  This file contains an algorithm to convert floating-point numbers from decimal to binary representations and vice-versa. The algorithms used by the
function are explained both on each method, and further down this comment.

MANUAL ALGORITHM

## Decimal to Binary (manual)
  Input: `num` - the base-10 representation of the float.

  1. Create a space for the binary representation, with (1 + exponent bit length + mantissa bit length) empty spaces.
  2. If `num` is positive, set the first space to "0", else set it to "1".
  3. Split `num` by it's decimal dot.
  4. Convert the integer part to it's binary representation using integer division by 2.
  5. Convert the decimal part to it's decimal representation using multiplication by 2.
  6. Join both representations, separating them by a binary decimal point.
  7. Normalize the representations, moving the decimal point left or right until only the digit "1" is present on the left size of the decimal point. 
Trim any "0" digits from the head of the number.
  8. Determine the offset exponent by counting the number of spaces to the left or right the decimal point moved, multiplying it by 1 or -1 for each 
acase respectively.
    - 7.1 The programatic methods can be used to determine the offset exponent. Read step 7 of the programatic algorithm.
  9. Calculate the exponent by adding the offset exponent to the bias. Skip to step 12.
    - 9.1 If the offset exponent minus the bias equals 0, the value of the exponent is 0.
  10. If the exponent is negative, the number is subnormal. Set the exponent bits to all "0" digits. Denormalize the binary data by prefixing it with 
"0" digits N times, where N is (bias - 2).
  11. Read the first N bits of the denormalized data, where N is the mantissa bit length. Suffix it with "0" digits until the mantissa bit length is 
reached. Skip to step 19
  12. Convert the exponent into it's binary representation. Prefix it with "0" digits until the exponent bit length is reached. If the binary 
representation exceeds the exponent bit length, do not prefix it.
  13. If the exponent bit representation length exceeds the exponent bit length, fill the exponent bits with "1" digits. Else skip to step 15.
  14. If the exponent is all "1" digits, set the mantissa to all "1" digits. Same if the absolute value of `num` exceeds (2^(k - 1) - 1, where k is 
the number of bits of the float).
  15. Read the mantissa bits from the normalized data: skip the first bit and read the next N bits of it, where N is the mantissa bit length. Prefix 
it with "0" as needed.
    - 15.1 If the number is subnormal, read the mantissa from the first bit.
  16. If the normalized data length exceeds the mantissa bit length, skip to step 19.
  17. If rounding is desired:
    - 17.1 If bits were trimmed from the normalized data, add the first one to the read data.
    - 17.2 Else, do nothing.
  18. Suffix the data with "0" digits if needed until the mantissa bit length is reached,
  19. Add the mantissa bits to the representation.

## Binary to Decimal (manual)
  1. If the length of the bits is different that the total bit length of the float (1 + exponent bit length + mantissa bit length), do not calculate.
  2. If the bits include anithing else than the digits "0" and "1", do not calculate.
  3. Determine the sign: If the first bit is "0", the sign is 1, else the sign is -1.
  4. Get the exponent: read the bits from 1 through (1 + exponent bit length). Convert it to decimal.
  5. Get the mantissa bits: read the bits from (1 + exponent bit length) through (1 + exponent bit length) through (1 + exponent bit length + mantissa 
bit length).
  6. If the exponent is greater than the double of the bias (2^(k-1) - 1, where k is the number of bits of the exponent of the float spec), the number 
is a special representation.
	  - 6.1 If the exponent is equal to the double of the bias + 1, the value is infinity. Return sign * the symbol for infinity.
	  - 6.2 Else, return the symbol for the NaN.
  7. Calculate the decimal value of the mantissa bits.
  8. Else, if the exponent is 0, return (sign * mantissa * 2^(1 - bias))
  9. Else, return (sign * (1 + mantissa) * 2^(exponent - bias))
*/

/**
 *   The `Float` allows the coversion between the decimal and binary representations of a floating-point number. It supports
 * floats of any size, not being restricted to the IEEE-754 sizes, however the algorithms used follow the IEEE-754 
 * specification.
 * 
 * Converting from decimal to binary can be done with or without rounding. Rounding is usually preferred.
 * 
 * Usage:
 * ```js
 * // Represents a floating-point number that uses 4 bits for the exponent and 3 bits for the 
 * // mantissa. The bit size of the binary representation can be accessed through the `totalBits`
 * // property or manually calculated using 2^(1 + exponent bits + mantissa bits) - 1.
 * //
 * // This floating-point number uses 8 bits.
 * const f = new Float(4, 3);
 * const num = -2.25;
 * const binR = f.toBinary(num, true);
 * const binNR = f.toBinary(num, false)
 * 
 * console.log(binR, f.toDecimal(binR));   // 11000001 -2.25
 * console.log(binNR, f.toDecimal(binNR)); // 11000001 -2.25
 * 
 * ```
 *
 * @class Float
 */
class Float {
	constructor(exponent, mantissa) {
		this.expBits = exponent;
		this.mantBits = mantissa;
		this.totalBits = 1 + exponent + mantissa;
		this.bias = Math.pow(2, exponent - 1) - 1;
		this.maxAbs = Math.pow(2, this.totalBits - 1) - 1;
	}

	/*
		## Decimal to Binary (toBinary)

		  Preliminar input: Exponent bits and mantissa bits.
		  Input: `num` - the base-10 representation of the float.

		  1. Determine the sign of `num` and store it in `signBit`. If posivite, store "0", else store "1".
		  2. If the number is in the exponential form (the digit "e" is present on the visual representation of the number), unexponentiate it.
		  3. Split `num` into it's integer and decimal parts, dropping the dot.
		  4. Convert the integer part into binary through integer division by 2.
		  5. Convert the decimal part into binary through multiplication by 2.
		  6. Normalize the binary representation of integer part (intBin).
		  7. Determine the offset exponent.
			  - 7.1 If the intBin has a high bit, the offset exponent is the length of the integer part - 1. 
			  - 7.2 Else, if the decPart has a high bit, the offset exponent is the 1-based index of the first occurance of an high bit.
			  - 7.3 If none of the above apply, the offset exponent is 0.
		  8. Calculate the exponent. The exponent is given by subtracting the bias of the float (2^(k-1) - 1, where k is the number of bits of the 
    exponent of the float spec) from the offset exponent.
		  9. Add the the binary representation of the decimal part (decBin) to the tail of the intDec to get the normalized data (normData).
		  10. If the exponent is negative, follow the rest of this step. Else skip to step 16. 
			  - 10.1 Set the exponent bits to all zeros.
			  - 10.2 Calculate the subnormal exponent by subtracting the bias from 1.
			  - 10.3 Denormalize the data by prefixing the data with N "0", where N is given by subtracting the subnormal exponent from the offset exponent. 
    If N is negative, do not prefix the data at all.
			  - 10.4 Determine the mantissa bits by getting all bytes from the denormalized data until it's end or it reaches the maximum bit length for the 
    mantissa. If the former occurs, append "0" until the it's length equals the maximum mantissa bits.
		  11. Convert the exponent into it's binary representation (expBits).
		  12. Prefix it with "0" until it's length equals the maximum bit length for the exponent. If the expBits exceed the maximum bit length, do not 
    prefix it at all.
		  13. If it's length exceed the maximum bit length, replace it with exclusively "1" for the entirety of the bit length of the exponent. Mark the 
    number as infinity.
		  14. Calculate the mantissa.
			  - 14.1 If the number is infinity or it's absolute value is greater than the maximum value of the float representation, fill the mantissa with 
    "0". Skip to step 16.
			  - 14.2 If the bit length of the normalizedData receeds or equals the maximum bit length for the mantissa, suffix it with "0" until the maximum 
    bit length for the mantissa is reached. Skip to step 16.
			  - 14.3 If the exponent is positive, drop the first digit of the normalized data and read all bits until it's end or the maximum bit length for 
    the mantissa.
			  - 14.4 If rounding is desired and the length of the normalized data exceeds the length of the maximum bit length of the mantissa, add the first 
    trimmed bit of the tail of the normalized data to the normalized data using binary addition.
			  - 14.5 If the length of the normalized data length exceeds the length of the maximum bit length of the mantissa, suffix the normalized data 
    with "0" until that length is reached. The value of the mantissa is the normalized data.
		  16. Join, sequentially, the sign bit, the exponent bits and the mantissa bits to get the binary representation of the floating point number.
	*/
	toBinary(num, rounding) {
		// Sign bit
		const signBit = num > 0 ? "0" : "1"

		// Initialization
		const _num = this._unexponentiate(num);
		const [int, dec] = _num.split(".");

		// Integer bits
		const intBits = this._toBinaryInt(Number(int));

		// Decimal bits
		const _decBits = [];
		let decN = Math.abs(Number(`0.${dec}`));
		let decNLim = this.totalBits;
		let iters = 0;
		
		while (iters <= decNLim && decN > 0) {
			const nn = decN * 2;

			_decBits.push(parseInt(this._unexponentiate(nn)));
			decN = Number(`0.${this._unexponentiate(nn).split(".")[1]}`);
			iters++;
		}

		const decBits = _decBits.join("");

		// Exponent
		let _exp = 0;
		let normIntBits = intBits.replace(/^0+/gm, "");
		if (normIntBits.includes("1")) {
			_exp = normIntBits.length - 1;
		} else if (decBits.includes("1")) {
			_exp = - (decBits.indexOf("1") + 1);
		}

		let exp = (_exp - this.bias === 0) ? 0 : _exp + this.bias;
		let expBits;

		// Mantissa
		let mantBits;
		const payloadData = intBits + decBits;
		const normalizedData = payloadData.replace(/^0+/gm, "");

		if (exp < 0) {
			expBits = "0".repeat(this.expBits);

			const nexp = 1 - this.bias;
			const denExp = _exp - nexp;
			const denormalizedData = "0".repeat(Math.max(0, -denExp - 1)) + normalizedData;

			mantBits = denormalizedData.substring(0, this.mantBits) + "0".repeat(Math.max(0, this.mantBits - denormalizedData.length));
		} else {
			const _expBits = this._toBinaryInt(exp);
			expBits = "0".repeat(Math.max(0, this.expBits - _expBits.length)) + _expBits;
			let inf = false;

			if (expBits.length > this.expBits) {
				expBits = "1".repeat(this.expBits);
				inf = true;
			}

			mantBits = (() => {
				if (inf || Math.abs(num) > this.maxAbs) {
					return "0".repeat(this.mantBits);
				}

				if (normalizedData.length <= this.mantBits) {
					const data = normalizedData.substring(+(exp > 0), this.mantBits);
					return data + "0".repeat(Math.max(0, this.mantBits - data.length));
				} else {
					let data = normalizedData.substring(+(exp > 0), this.mantBits + +(exp > 0));

					if (rounding) {
						const lsb = normalizedData[this.mantBits + 1] || "0";
						let _data = data.split("").reverse();

						let sum = parseInt(lsb);
						let carry = 0;
						loop: for (let i = 0; i < _data.length; i++) {
							const bit = parseInt(_data[i]);

							switch (bit + sum) {
								case 0: {
									_data[i] = `${carry}`;
									break loop;
								}
								case 1: {
									if (carry) {
										_data[i] = "0";
										carry = 0;
									} else _data[i] = "1";

									break loop;
								}
								case 2: {
									if (carry) _data[i] = "1"
									carry = 1;
									continue;
								}
							}
						}

						data = _data.reverse().join("");
					}

					return data + "0".repeat(Math.max(0, this.mantBits - data.length));
				}
			})();
		}

		return signBit + expBits + mantBits;
	}

	/*
		## Binary to Decimal (toDecimal)

		Preliminar input: Exponent bits and mantissa bits.
		Input: `bits` - the base-2 representation of the float.

		  1. If the length of the bits is different that the total bit length of the float (1 + exponent bit length + mantissa bit length), do not calculate.
		  2. If the bits include anithing else than the digits "0" and "1", do not calculate.
		  3. Determine the sign: If the first bit is "0", the sign is 1, else the sign is -1.
		  4. Get the exponent: read the bits from 1 through (1 + exponent bit length). Convert it to decimal.
		  5. Get the mantissa bits: read the bits from (1 + exponent bit length) through (1 + exponent bit length) through (1 + exponent bit length + 
    mantissa bit length).
		  6. If the exponent is greater than the double of the bias (2^(k-1) - 1, where k is the number of bits of the exponent of the float spec), the 
    number is a special representation.
			  - 6.1 If the exponent is equal to the double of the bias + 1, the value is infinity. Return sign * the symbol for infinity.
			  - 6.2 Else, return the symbol for the NaN.
		  7. Calculate the decimal value of the mantissa bits.
		  8. Else, if the exponent is 0, return (sign * mantissa * 2^(1 - bias))
		  9. Else, return (sign * (1 + mantissa) * 2^(exponent - bias))
	*/
	toDecimal(bits) {
		if (bits.length !== this.totalBits) return NaN;
			//throw new Error(`Not a valid minifloat for the S-E-M configuration ${this.expBits}-${this.mantBits}`);
		
		if (bits.split("").some(c => !["0", "1"].includes(c))) return NaN;
			//throw new Error("Not a binary string.");

		const sign = parseInt(bits[0], 2) == 0 ? 1 : -1;
		const rawExp = parseInt(bits.substring(1, 1 + this.expBits), 2);
		const mant = bits.substring(1 + this.expBits, 1 + this.expBits + this.mantBits);

		let v;
		if (rawExp > this.bias * 2) { // Special
			if (rawExp == this.bias * 2 + 1 && parseInt(mant, 2) === 0) { // Infinity
				return sign * Infinity;
			} else return NaN;
		} else if (rawExp === 0) { // Subnormal
			v = sign * this._binaryFracToDec(mant) * Math.pow(2, 1 - this.bias);
		} else { // Normal
			v = sign * (1 + this._binaryFracToDec(mant)) * Math.pow(2, rawExp - this.bias);
		}

		return v;
	}

	_binaryFracToDec(bits) {
		let num = 0;

		for (let i = 0; i < bits.length; i++) {
			num += bits[i] * Math.pow(2, -(i + 1));
		}

		return num;
	}
	
	_toBinaryInt(num) {
		const bits = [];
		let n = Math.abs(num);

		do {
			bits.push(n % 2)
			n = Math.floor(n / 2);
		} while (parseInt(n) > 0)

		return bits.reverse().join("");
	}

	_precisionDecimal(a) {
		if (!isFinite(a)) return 0;

		let e = 1, p = 0;
		while (Math.round(a * e) / e !== a) { e *= 10; p++; }

		return p;
	}

	_unexponentiate(num) {
		let data = String(num).split(/[eE]/);
		if (data.length == 1) return data[0];

		let z = '',
			sign = num < 0 ? '-' : '',
			str = data[0].replace('.', ''),
			mag = Number(data[1]) + 1;

		if (mag < 0) {
			z = sign + '0.';
			while (mag++) z += '0';
			return z + str.replace(/^\-/, '');
		}
		mag -= str.length;
		while (mag--) z += '0';
		return str + z;
	}
}
